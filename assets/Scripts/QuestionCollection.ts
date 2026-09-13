import { _decorator, Component, Node, tween, UITransform, UIOpacity, Vec3, view } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { AristotleQuestion } from './AristotleQuestion';

const { ccclass } = _decorator;
const QUESTION_COUNT = 4;

@ccclass('QuestionCollection')
export class QuestionCollection extends Component {
    private initialized = false;
    private collected: boolean[] = [];
    private collectedCount = 0;
    private changingScene = false;
    private entrancePlaying = false;
    private layoutScale = 1;
    private notebook: Node = null;
    private notebookOpacity: UIOpacity = null;
    private questionMark: Node = null;
    private collectQuestions: Node[] = [];
    private notebookQuestions: Node[] = [];
    private collectPositions: Vec3[] = [];
    private notebookPosition: Vec3 = null;
    private questionMarkPosition: Vec3 = null;

    protected onLoad(): void {
        this.ensureInitialized();
        view.on('canvas-resize', this.adaptToScreen, this);
        view.on('design-resolution-changed', this.adaptToScreen, this);
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.adaptToScreen, this);
        view.off('design-resolution-changed', this.adaptToScreen, this);
    }

    /** 使用预制体已有节点刷新问题收集数据。 */
    public refresh(active = true): void {
        this.ensureInitialized();
        this.collected = new Array(QUESTION_COUNT).fill(false);
        this.collectedCount = 0;
        this.changingScene = false;
        this.entrancePlaying = false;
        this.adaptToScreen();
        this.notebook.setPosition(this.scaledPosition(this.notebookPosition));
        this.notebook.setScale(this.layoutScale, this.layoutScale, 1);
        this.notebookOpacity.opacity = 165;
        this.questionMark.setPosition(this.scaledPosition(this.questionMarkPosition));
        this.questionMark.setScale(this.layoutScale, this.layoutScale, 1);

        this.collectQuestions.forEach((node, index) => {
            node.active = true;
            node.setPosition(this.scaledPosition(this.collectPositions[index]));
            node.setScale(this.layoutScale, this.layoutScale, 1);
        });
        this.notebookQuestions.forEach(node => node.active = false);
        this.node.active = active;
    }

    /** 用预制体中的真实节点代替“问题页导入”视频完成过渡。 */
    public playEntrance(): Promise<void> {
        this.refresh(true);
        this.entrancePlaying = true;

        const center = this.scaledPosition(this.questionMarkPosition);
        const finalScale = this.layoutScale;
        this.questionMark.setScale(finalScale * 0.15, finalScale * 0.15, 1);
        this.notebook.setScale(finalScale * 0.7, finalScale * 0.7, 1);
        this.notebook.setPosition(center);

        tween(this.questionMark)
            .to(0.28, { scale: new Vec3(finalScale * 1.12, finalScale * 1.12, 1) })
            .to(0.12, { scale: new Vec3(finalScale, finalScale, 1) })
            .start();
        tween(this.notebook)
            .delay(0.2)
            .to(0.5, {
                position: this.scaledPosition(this.notebookPosition),
                scale: new Vec3(finalScale, finalScale, 1),
            }, { easing: 'backOut' })
            .start();

        return new Promise(resolve => {
            this.collectQuestions.forEach((node, index) => {
                node.setPosition(center);
                node.setScale(finalScale * 0.12, finalScale * 0.12, 1);
                tween(node)
                    .delay(0.35 + index * 0.1)
                    .to(0.5, {
                        position: this.scaledPosition(this.collectPositions[index]),
                        scale: new Vec3(finalScale, finalScale, 1),
                    }, { easing: 'backOut' })
                    .call(() => {
                        if (index === QUESTION_COUNT - 1) {
                            this.entrancePlaying = false;
                            resolve();
                        }
                    })
                    .start();
            });
        });
    }

    private ensureInitialized(): void {
        if (this.initialized) return;

        this.notebook = this.requireChild('QuestionNotebook');
        this.questionMark = this.requireChild('QuestionMark');
        this.notebookPosition = this.notebook.position.clone();
        this.questionMarkPosition = this.questionMark.position.clone();
        this.notebookOpacity = this.notebook.getComponent(UIOpacity);
        if (!this.notebookOpacity) {
            throw new Error('QuestionCollection.prefab 缺少 QuestionNotebook/UIOpacity');
        }

        for (let index = 0; index < QUESTION_COUNT; index++) {
            const source = this.requireChild(`CollectQuestion${index}`);
            const target = this.notebook.getChildByName(`NotebookQuestion${index}`);
            if (!target) throw new Error(`QuestionCollection.prefab 缺少 NotebookQuestion${index}`);

            this.collectQuestions.push(source);
            this.notebookQuestions.push(target);
            this.collectPositions.push(source.position.clone());
            source.on(Node.EventType.TOUCH_END, () => this.collectQuestion(index), this);
        }

        this.notebook.on(Node.EventType.TOUCH_END, this.openAristotleQuestion, this);
        this.initialized = true;
    }

    private collectQuestion(index: number): void {
        if (this.entrancePlaying || this.collected[index] || this.changingScene) return;

        this.collected[index] = true;
        const source = this.collectQuestions[index];
        const target = this.notebookQuestions[index];
        tween(source)
            .to(0.35, {
                worldPosition: target.worldPosition,
                scale: new Vec3(0.45, 0.45, 1),
            })
            .call(() => {
                source.active = false;
                target.active = true;
                this.collectedCount++;
                if (this.collectedCount === QUESTION_COUNT) {
                    this.notebookOpacity.opacity = 255;
                    tween(this.notebook)
                        .to(0.12, { scale: new Vec3(1.06, 1.06, 1) })
                        .to(0.12, { scale: Vec3.ONE })
                        .start();
                }
            })
            .start();
    }

    private async openAristotleQuestion(): Promise<void> {
        if (this.collectedCount !== QUESTION_COUNT || this.changingScene) return;
        this.changingScene = true;

        const nextNode = await yy.UIManager.ShowUI('Prefabs/AristotleQuestion', yy.UI);
        const nextView = nextNode.getComponent(AristotleQuestion);
        if (!nextView) {
            this.changingScene = false;
            throw new Error('AristotleQuestion.prefab 缺少 AristotleQuestion 脚本');
        }

        this.node.active = false;
        await nextView.enter();
    }

    private requireChild(name: string): Node {
        const child = this.node.getChildByName(name);
        if (!child) throw new Error(`QuestionCollection.prefab 缺少 ${name}`);
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

        if (!this.entrancePlaying) {
            this.questionMark.setPosition(this.scaledPosition(this.questionMarkPosition));
            this.questionMark.setScale(this.layoutScale, this.layoutScale, 1);
            this.notebook.setPosition(this.scaledPosition(this.notebookPosition));
            this.notebook.setScale(this.layoutScale, this.layoutScale, 1);
            this.collectQuestions.forEach((node, index) => {
                node.setPosition(this.scaledPosition(this.collectPositions[index]));
                node.setScale(this.layoutScale, this.layoutScale, 1);
            });
        }
    }

    private scaledPosition(position: Vec3): Vec3 {
        return new Vec3(position.x * this.layoutScale, position.y * this.layoutScale, position.z);
    }
}

export async function showQuestionCollection(active = true): Promise<Node> {
    const node = await yy.UIManager.ShowUI('Prefabs/QuestionCollection', yy.UI);
    const view = node.getComponent(QuestionCollection);
    if (!view) throw new Error('QuestionCollection.prefab 缺少 QuestionCollection 脚本');

    view.refresh(active);
    return node;
}
