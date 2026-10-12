import {
    _decorator, Color, Component, EventTouch, Graphics, Label, Node, Sprite, SpriteFrame, tween, Tween,
    UITransform, UIOpacity, Vec3, view,
} from 'cc';
import { yy } from '../Pioneer/Pioneer';

const { ccclass } = _decorator;
const QUESTION_COUNT = 4;
const GUIDE_TEXT = 'これらの問題をアリストテレスに聞いてみよう';
const ANSWER_PAGE_ZOOM = 1.6;
const ANSWER_PAGE_SHIFT_X = 60;

@ccclass('AristotleQuestion')
export class AristotleQuestion extends Component {
    private initialized = false;
    private dragEnabled = false;
    private answerOpen = false;
    private answerTransitioning = false;
    private collecting = false;
    private pageTurning = false;
    private showingAnswerPage = false;
    private pendingAnswerIndex = -1;
    private returningToDesk = false;
    private runToken = 0;
    private layoutScale = 1;
    private rootTransform: UITransform = null;
    private aristotle: Node = null;
    private notebook: Node = null;
    private notebookOpacity: UIOpacity = null;
    private questionPage: Node = null;
    private clip: Node = null;
    private clipGlow: Node = null;
    private clipGlowOpacity: UIOpacity = null;
    private scrollFrame: SpriteFrame = null;
    private collectedAuthor: Node = null;
    private authorPanel: Node = null;
    private guide: Node = null;
    private guideLabel: Label = null;
    private questions: Node[] = [];
    private answers: Node[] = [];
    private scrolls: Node[] = [];
    private collectedAnswers: Node[] = [];
    private answerPanels: Node[] = [];
    private asked: boolean[] = [];
    private collected: boolean[] = [];
    private questionPositions: Vec3[] = [];
    private dragOffsets: Vec3[] = [];
    private dragging: boolean[] = [];
    private layoutNodes: Node[] = [];
    private layoutPositions: Vec3[] = [];

    protected onLoad(): void {
        this.ensureInitialized();
        view.on('canvas-resize', this.adaptToScreen, this);
        view.on('design-resolution-changed', this.adaptToScreen, this);
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.adaptToScreen, this);
        view.off('design-resolution-changed', this.adaptToScreen, this);
    }

    protected onDisable(): void {
        this.runToken++;
        this.dragEnabled = false;
        this.dragging.fill(false);
        this.stopClipGlow();
    }

    /** 使用预制体已有节点刷新人物问答数据并进入页面。 */
    public async enter(): Promise<void> {
        this.ensureInitialized();
        this.resetData();
        this.node.active = true;
        this.adaptToScreen();

        const token = ++this.runToken;
        this.guide.active = true;
        await this.playTypewriter(GUIDE_TEXT, 0.05, token);
        await this.waitSeconds(0.5);
        if (token !== this.runToken || !this.node.active) return;

        this.guide.active = false;
        this.dragEnabled = true;
    }

    private resetData(): void {
        this.dragEnabled = false;
        this.answerOpen = false;
        this.answerTransitioning = false;
        this.collecting = false;
        this.pageTurning = false;
        this.showingAnswerPage = false;
        this.pendingAnswerIndex = -1;
        this.returningToDesk = false;
        this.asked.fill(false);
        this.collected.fill(false);
        this.stopClipGlow();
        this.notebookOpacity.opacity = 255;
        this.questionPage.active = true;
        this.collectedAuthor.active = false;
        this.authorPanel.active = false;
        this.collectedAnswers.forEach(node => node.active = false);
        this.answerPanels.forEach(node => node.active = false);
        this.scrolls.forEach(scroll => {
            Tween.stopAllByTarget(scroll);
            scroll.active = false;
            scroll.setPosition(-240, -60, 0);
            scroll.setScale(this.layoutScale, this.layoutScale, 1);
        });
        this.answers.forEach(answer => {
            Tween.stopAllByTarget(answer);
            answer.active = false;
        });
        this.questions.forEach((question, index) => {
            question.setParent(this.notebook);
            question.setPosition(this.questionPositions[index]);
            question.setScale(Vec3.ONE);
            question.active = true;
            this.dragging[index] = false;
        });
        this.guideLabel.string = '';
        this.guide.active = false;
    }

    private ensureInitialized(): void {
        if (this.initialized) return;

        this.rootTransform = this.node.getComponent(UITransform);
        this.aristotle = this.requireChild('Aristotle');
        this.aristotle.on(Node.EventType.TOUCH_END, this.returnToDesk, this);
        this.notebook = this.requireChild('QuestionNotebook');
        this.notebookOpacity = this.notebook.getComponent(UIOpacity);
        this.questionPage = this.notebook.getChildByName('QuestionPage');
        this.clip = this.notebook.getChildByName('换页夹子');
        this.collectedAuthor = this.notebook.getChildByName('CollectedAuthor');
        this.scrollFrame = this.requireChild('ScrollArt').getComponent(Sprite)?.spriteFrame;
        this.guide = this.requireChild('QuestionGuide');
        this.guideLabel = this.guide.getComponent(Label);
        if (!this.rootTransform || !this.notebookOpacity || !this.questionPage
            || !this.clip || !this.collectedAuthor || !this.scrollFrame || !this.guideLabel) {
            throw new Error('AristotleQuestion.prefab 的 UI 组件配置不完整');
        }
        this.createClipGlow();
        this.clip.on(Node.EventType.TOUCH_END, this.flipNotebookPage, this);
        this.authorPanel = this.createTextPanel(this.collectedAuthor);

        for (let index = 0; index < QUESTION_COUNT; index++) {
            const question = this.notebook.getChildByName(`NotebookQuestion${index}`);
            const answer = this.requireChild(`Answer${index}`);
            const collectedAnswer = this.notebook.getChildByName(`CollectedAnswer${index}`);
            if (!question || !answer || !collectedAnswer) {
                throw new Error(`AristotleQuestion.prefab 缺少第 ${index + 1} 题或答案节点`);
            }

            this.questions.push(question);
            this.answers.push(answer);
            this.collectedAnswers.push(collectedAnswer);
            this.answerPanels.push(this.createTextPanel(collectedAnswer));
            this.scrolls.push(this.createScroll(index));
            this.asked.push(false);
            this.collected.push(false);
            this.questionPositions.push(question.position.clone());
            this.dragOffsets.push(new Vec3());
            this.dragging.push(false);
            question.on(Node.EventType.TOUCH_START, event => this.beginDrag(index, event), this);
            question.on(Node.EventType.TOUCH_MOVE, event => this.moveQuestion(index, event), this);
            question.on(Node.EventType.TOUCH_END, event => this.finishDrag(index, event), this);
            question.on(Node.EventType.TOUCH_CANCEL, event => this.finishDrag(index, event, true), this);
            answer.on(Node.EventType.TOUCH_END, () => this.rollAnswer(index), this);
        }

        this.layoutNodes = [
            this.requireChild('AristotleName'),
            this.aristotle,
            this.notebook,
            this.guide,
            ...this.answers,
            ...this.scrolls,
        ];
        this.layoutPositions = this.layoutNodes.map(node => node.position.clone());

        this.initialized = true;
        this.adaptToScreen();
    }

    private beginDrag(index: number, event: EventTouch): void {
        if (!this.dragEnabled || this.answerOpen || this.answerTransitioning
            || this.pageTurning || this.showingAnswerPage || this.pendingAnswerIndex !== -1) return;

        const touchPosition = this.convertTouch(event);
        const question = this.questions[index];
        const currentPosition = this.rootTransform.convertToNodeSpaceAR(question.worldPosition);
        this.dragOffsets[index].set(
            touchPosition.x - currentPosition.x,
            touchPosition.y - currentPosition.y,
            0
        );
        question.setParent(this.node, true);
        this.dragging[index] = true;
        event.propagationStopped = true;
    }

    private moveQuestion(index: number, event: EventTouch): void {
        if (!this.dragging[index]) return;

        const touchPosition = this.convertTouch(event);
        const offset = this.dragOffsets[index];
        this.questions[index].setPosition(
            touchPosition.x - offset.x,
            touchPosition.y - offset.y,
            0
        );
        event.propagationStopped = true;
    }

    private finishDrag(index: number, event: EventTouch, cancelled = false): void {
        if (!this.dragging[index]) return;

        this.dragging[index] = false;
        event.propagationStopped = true;
        const characterTransform = this.aristotle.getComponent(UITransform);
        const accepted = !cancelled && characterTransform
            && characterTransform.getBoundingBoxToWorld().contains(event.getUILocation());

        if (!accepted) {
            const question = this.questions[index];
            question.setParent(this.notebook, true);
            tween(question).to(0.2, {
                position: this.questionPositions[index].clone(),
            }).start();
            return;
        }

        this.questions[index].active = false;
        this.asked[index] = true;
        this.answerOpen = true;
        const answer = this.answers[index];
        answer.active = true;
        answer.setScale(this.layoutScale * 0.85, this.layoutScale * 0.85, 1);
        tween(answer).to(0.18, {
            scale: new Vec3(this.layoutScale, this.layoutScale, 1),
        }).start();
    }

    private rollAnswer(index: number): void {
        const answer = this.answers[index];
        if (!answer.active || !this.answerOpen || this.answerTransitioning) return;
        this.answerTransitioning = true;
        const scroll = this.scrolls[index];
        tween(answer)
            .to(0.3, {
                position: scroll.position.clone(),
                scale: new Vec3(this.layoutScale * 0.12, this.layoutScale * 0.12, 1),
            })
            .call(() => {
                answer.active = false;
                scroll.active = true;
                scroll.setScale(this.layoutScale * 0.5, this.layoutScale * 0.5, 1);
                tween(scroll).to(0.2, {
                    scale: new Vec3(this.layoutScale, this.layoutScale, 1),
                }, { easing: 'backOut' }).start();
                this.pendingAnswerIndex = index;
                this.answerOpen = false;
                this.answerTransitioning = false;
                this.startClipGlow();
            })
            .start();
    }

    private flipNotebookPage(event: EventTouch): void {
        event.propagationStopped = true;
        if (this.pageTurning || this.answerOpen || this.answerTransitioning || this.collecting) return;
        if (!this.showingAnswerPage && this.pendingAnswerIndex === -1
            && !this.collected.some(Boolean)) return;

        this.pageTurning = true;
        const nextAnswerPage = !this.showingAnswerPage;
        const notebookIndex = this.layoutNodes.indexOf(this.notebook);
        const basePosition = this.layoutPositions[notebookIndex];
        const notebookScale = this.layoutScale * (nextAnswerPage ? ANSWER_PAGE_ZOOM : 1);
        tween(this.notebook).to(0.24, {
            position: new Vec3(
                (basePosition.x - (nextAnswerPage ? ANSWER_PAGE_SHIFT_X : 0)) * this.layoutScale,
                basePosition.y * this.layoutScale,
                basePosition.z,
            ),
            scale: new Vec3(notebookScale, notebookScale, 1),
        }).start();
        tween(this.notebookOpacity)
            .to(0.12, { opacity: 95 })
            .call(() => {
                this.showingAnswerPage = nextAnswerPage;
                this.questionPage.active = !this.showingAnswerPage;
                this.questions.forEach((question, index) => {
                    question.active = !this.showingAnswerPage && !this.asked[index];
                });
                this.collectedAuthor.active = this.showingAnswerPage;
                this.authorPanel.active = this.showingAnswerPage;
                this.collectedAnswers.forEach((node, index) => {
                    node.active = this.showingAnswerPage && this.collected[index];
                    this.answerPanels[index].active = node.active;
                });
                this.guide.active = this.showingAnswerPage && this.pendingAnswerIndex !== -1;
                if (this.guide.active) this.guideLabel.string = '回答をノートに記録しましょう';
            })
            .to(0.12, { opacity: 255 })
            .call(() => { this.pageTurning = false; })
            .start();
    }

    private collectScroll(index: number, event: EventTouch): void {
        event.propagationStopped = true;
        if (!this.showingAnswerPage || this.pageTurning || this.collecting
            || this.pendingAnswerIndex !== index) return;

        this.collecting = true;
        const scroll = this.scrolls[index];
        const target = this.collectedAnswers[index];
        tween(scroll)
            .to(0.4, {
                worldPosition: target.worldPosition.clone(),
                scale: new Vec3(this.layoutScale * 0.25, this.layoutScale * 0.25, 1),
            }, { easing: 'quadIn' })
            .call(() => {
                scroll.active = false;
                target.active = true;
                this.answerPanels[index].active = true;
                this.collected[index] = true;
                this.pendingAnswerIndex = -1;
                this.collecting = false;
                this.guide.active = false;
                this.stopClipGlow();
                if (this.collected.every(Boolean)) {
                    this.guideLabel.string = 'アリストテレスをクリックして机に戻りましょう';
                    this.guide.active = true;
                }
            })
            .start();
    }

    private returnToDesk(event: EventTouch): void {
        if (this.returningToDesk || this.pageTurning || this.collecting
            || this.answerOpen || this.answerTransitioning || this.pendingAnswerIndex !== -1
            || !this.collected.every(Boolean)) return;

        const desk = yy.UI?.getChildByName('DoorMiddle');
        if (!desk?.isValid) return;

        event.propagationStopped = true;
        this.returningToDesk = true;
        this.node.active = false;
        yy.EventCenter.dispatchEvent(yy.EventName.RETURN_TO_DESK_AFTER_ARISTOTLE);
    }

    private createScroll(index: number): Node {
        const scroll = new Node(`AnswerScroll${index}`);
        scroll.layer = this.node.layer;
        scroll.parent = this.node;
        scroll.setPosition(-240, -60, 0);
        scroll.addComponent(UITransform).setContentSize(140, 90);

        const art = new Node('ScrollImage');
        art.layer = scroll.layer;
        art.parent = scroll;
        art.addComponent(UITransform).setContentSize(25, 105);
        art.setRotationFromEuler(0, 0, -65);
        const sprite = art.addComponent(Sprite);
        sprite.spriteFrame = this.scrollFrame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        art.getComponent(UITransform).setContentSize(25, 105);

        scroll.on(Node.EventType.TOUCH_END, event => this.collectScroll(index, event), this);
        scroll.active = false;
        return scroll;
    }

    private createClipGlow(): void {
        const clipSprite = this.clip.getComponent(Sprite);
        const clipSize = this.clip.getComponent(UITransform)?.contentSize;
        if (!clipSprite?.spriteFrame || !clipSize) {
            throw new Error('AristotleQuestion.prefab 的夹子缺少 Sprite 或 UITransform');
        }

        const glow = new Node('ClipGlow');
        glow.layer = this.clip.layer;
        glow.parent = this.notebook;
        glow.setSiblingIndex(this.clip.getSiblingIndex());
        glow.setPosition(this.clip.position);
        glow.setScale(1.13, 1.13, 1);
        glow.addComponent(UITransform).setContentSize(clipSize);
        const outerSprite = glow.addComponent(Sprite);
        outerSprite.spriteFrame = clipSprite.spriteFrame;
        outerSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        outerSprite.color = new Color(255, 205, 45, 255);
        glow.getComponent(UITransform).setContentSize(clipSize);

        const halo = new Node('OuterHalo');
        halo.layer = glow.layer;
        halo.parent = glow;
        halo.addComponent(UITransform).setContentSize(210, 125);
        const graphics = halo.addComponent(Graphics);
        for (const [spread, alpha] of [[13, 30], [7, 45], [2, 65]]) {
            graphics.fillColor = new Color(255, 222, 82, alpha);
            graphics.ellipse(0, 4, 31 + spread, 39 + spread);
            graphics.fill();
            graphics.roundRect(-78 - spread, -40 - spread / 2,
                156 + spread * 2, 21 + spread, 10 + spread / 2);
            graphics.fill();
        }

        const softEdge = new Node('SoftEdge');
        softEdge.layer = glow.layer;
        softEdge.parent = glow;
        softEdge.setScale(1.12, 1.12, 1);
        softEdge.addComponent(UITransform).setContentSize(clipSize);
        const softSprite = softEdge.addComponent(Sprite);
        softSprite.spriteFrame = clipSprite.spriteFrame;
        softSprite.sizeMode = Sprite.SizeMode.CUSTOM;
        softSprite.color = new Color(255, 195, 35, 100);
        softEdge.getComponent(UITransform).setContentSize(clipSize);

        this.clipGlowOpacity = glow.addComponent(UIOpacity);
        glow.active = false;
        this.clipGlow = glow;
    }

    private startClipGlow(): void {
        this.clipGlow.active = true;
        this.clipGlowOpacity.opacity = 65;
        tween(this.clipGlowOpacity)
            .to(0.6, { opacity: 200 })
            .to(0.6, { opacity: 65 })
            .union()
            .repeatForever()
            .start();
    }

    private stopClipGlow(): void {
        if (!this.clipGlowOpacity) return;
        Tween.stopAllByTarget(this.clipGlowOpacity);
        this.clipGlow.active = false;
    }

    private createTextPanel(textNode: Node): Node {
        const panel = new Node(`${textNode.name}Background`);
        panel.layer = this.notebook.layer;
        panel.parent = this.notebook;
        panel.setSiblingIndex(textNode.getSiblingIndex());
        panel.setPosition(textNode.position);
        panel.addComponent(UITransform).setContentSize(268, 30);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(246, 231, 202, 235);
        graphics.roundRect(-134, -15, 268, 30, 3);
        graphics.fill();
        panel.active = false;
        return panel;
    }

    private convertTouch(event: EventTouch): Vec3 {
        const location = event.getUILocation();
        return this.rootTransform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    }

    private playTypewriter(text: string, speed: number, token: number): Promise<void> {
        this.guideLabel.string = '';
        const progress = { value: 0 };
        return new Promise(resolve => {
            tween(progress)
                .to(text.length * speed, { value: text.length }, {
                    onUpdate: () => {
                        if (token === this.runToken) {
                            this.guideLabel.string = text.substring(0, Math.floor(progress.value));
                        }
                    },
                })
                .call(() => {
                    if (token === this.runToken) this.guideLabel.string = text;
                    resolve();
                })
                .start();
        });
    }

    private waitSeconds(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    private requireChild(name: string): Node {
        const child = this.node.getChildByName(name);
        if (!child) throw new Error(`AristotleQuestion.prefab 缺少 ${name}`);
        return child;
    }

    private adaptToScreen(): void {
        if (!this.initialized || !this.node.parent) return;

        const parentTransform = this.node.parent.getComponent(UITransform);
        const rootTransform = this.node.getComponent(UITransform);
        if (!parentTransform || !rootTransform) return;

        const size = parentTransform.contentSize;
        this.layoutScale = Math.min(size.width / 1920, size.height / 1080);
        rootTransform.setContentSize(size);
        this.layoutNodes.forEach((node, index) => {
            const position = this.layoutPositions[index];
            const isAnswerNotebook = node === this.notebook && this.showingAnswerPage;
            node.setPosition(
                (position.x - (isAnswerNotebook ? ANSWER_PAGE_SHIFT_X : 0)) * this.layoutScale,
                position.y * this.layoutScale,
                position.z,
            );
            const nodeScale = this.layoutScale * (isAnswerNotebook ? ANSWER_PAGE_ZOOM : 1);
            node.setScale(nodeScale, nodeScale, 1);
        });
    }
}
