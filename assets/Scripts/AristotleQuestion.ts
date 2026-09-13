import {
    _decorator, Component, EventTouch, Label, Node, tween,
    UITransform, UIOpacity, Vec3, view,
} from 'cc';

const { ccclass } = _decorator;
const QUESTION_COUNT = 4;
const GUIDE_TEXT = 'これらの問題をアリストテレスに聞いてみよう';

@ccclass('AristotleQuestion')
export class AristotleQuestion extends Component {
    private initialized = false;
    private dragEnabled = false;
    private answerOpen = false;
    private answeredCount = 0;
    private runToken = 0;
    private layoutScale = 1;
    private rootTransform: UITransform = null;
    private aristotle: Node = null;
    private notebook: Node = null;
    private notebookOpacity: UIOpacity = null;
    private guide: Node = null;
    private guideLabel: Label = null;
    private questions: Node[] = [];
    private answers: Node[] = [];
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
        this.answeredCount = 0;
        this.notebookOpacity.opacity = 255;
        this.answers.forEach(answer => {
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
        this.notebook = this.requireChild('QuestionNotebook');
        this.notebookOpacity = this.notebook.getComponent(UIOpacity);
        this.guide = this.requireChild('QuestionGuide');
        this.guideLabel = this.guide.getComponent(Label);
        if (!this.rootTransform || !this.notebookOpacity || !this.guideLabel) {
            throw new Error('AristotleQuestion.prefab 的 UI 组件配置不完整');
        }

        for (let index = 0; index < QUESTION_COUNT; index++) {
            const question = this.notebook.getChildByName(`NotebookQuestion${index}`);
            const answer = this.requireChild(`Answer${index}`);
            if (!question) throw new Error(`AristotleQuestion.prefab 缺少 NotebookQuestion${index}`);

            this.questions.push(question);
            this.answers.push(answer);
            this.questionPositions.push(question.position.clone());
            this.dragOffsets.push(new Vec3());
            this.dragging.push(false);
            question.on(Node.EventType.TOUCH_START, event => this.beginDrag(index, event), this);
            question.on(Node.EventType.TOUCH_MOVE, event => this.moveQuestion(index, event), this);
            question.on(Node.EventType.TOUCH_END, event => this.finishDrag(index, event), this);
            question.on(Node.EventType.TOUCH_CANCEL, event => this.finishDrag(index, event, true), this);
            answer.on(Node.EventType.TOUCH_END, () => this.closeAnswer(index), this);
        }

        this.layoutNodes = [
            this.requireChild('AristotleName'),
            this.aristotle,
            this.notebook,
            this.guide,
            ...this.answers,
        ];
        this.layoutPositions = this.layoutNodes.map(node => node.position.clone());

        this.initialized = true;
        this.adaptToScreen();
    }

    private beginDrag(index: number, event: EventTouch): void {
        if (!this.dragEnabled || this.answerOpen) return;

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
        this.answerOpen = true;
        this.answeredCount++;
        const answer = this.answers[index];
        answer.active = true;
        answer.setScale(this.layoutScale * 0.85, this.layoutScale * 0.85, 1);
        tween(answer).to(0.18, {
            scale: new Vec3(this.layoutScale, this.layoutScale, 1),
        }).start();
    }

    private closeAnswer(index: number): void {
        const answer = this.answers[index];
        if (!answer.active) return;

        answer.active = false;
        this.answerOpen = false;
        if (this.answeredCount === QUESTION_COUNT) this.notebookOpacity.opacity = 175;
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
            node.setPosition(position.x * this.layoutScale, position.y * this.layoutScale, position.z);
            node.setScale(this.layoutScale, this.layoutScale, 1);
        });
    }
}
