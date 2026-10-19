import {
    _decorator, Component, EventTouch, Node, tween, UITransform, Vec3, view,
} from 'cc';
import { yy } from '../Pioneer/Pioneer';

const { ccclass } = _decorator;
export type SceneThreeScreen = 'galileo' | 'gravity' | 'choice' | 'ending' | 'ideas';
export type SceneThreeClue = 'moon' | 'jupiter' | 'gravity';

export interface SceneThreeViewData {
    screen: SceneThreeScreen;
    gravityDone: boolean;
    answerIndices: number[];
    deliveredAnswers: number[];
    notebookOpened: boolean;
    selectedClue: SceneThreeClue | null;
    selectedAnswerIndex: number | null;
    dialogueState: 'none' | 'missing' | 'prompt' | 'quote' | 'no-answer';
    ending: 'confess' | 'refuse' | null;
}

export interface SceneThreeViewActions {
    close(): void;
    toggleNotebook(): void;
    characterAction(): void;
    openBook(): void;
    ask(answerIndex: number): void;
    showNoAnswer(): void;
    collectAnswer(answerIndex: number): void;
    gravityFinished(): void;
    chooseEnding(kind: 'confess' | 'refuse'): void;
    back(): void;
}

/** Presentation adapter for the authored SceneThree prefab. It never creates UI nodes. */
@ccclass('SceneThreeView')
export class SceneThreeView extends Component {
    private data: SceneThreeViewData = null;
    private actions: SceneThreeViewActions = null;
    private groups: Record<SceneThreeScreen, Node> = null;
    private ideaQuestionText: Node = null;
    private readonly answerDrag = new Map<number, { node: Node; start: Vec3; offset: Vec3 }>();

    protected onLoad(): void {
        this.groups = {
            galileo: this.requireNode('Galileo'),
            gravity: this.requireNode('Gravity'),
            choice: this.requireNode('Choice'),
            ending: this.requireNode('Ending'),
            ideas: this.requireNode('IdeaPage'),
        };
        this.ideaQuestionText = this.requireNode('IdeaQuestionText');
        this.bindInteractions();
        view.on('canvas-resize', this.adaptToScreen, this);
        view.on('design-resolution-changed', this.adaptToScreen, this);
        this.adaptToScreen();
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.adaptToScreen, this);
        view.off('design-resolution-changed', this.adaptToScreen, this);
    }

    /** Images and text are serialized in the prefab; initialization only validates its display nodes. */
    public initialize(): void {
        this.adaptToScreen();
    }

    public refresh(data: SceneThreeViewData, actions: SceneThreeViewActions): void {
        this.data = data;
        this.actions = actions;
        const showingIdeas = data.screen === 'ideas';
        this.ideaQuestionText.active = showingIdeas;
        for (const screen of Object.keys(this.groups) as SceneThreeScreen[]) {
            this.groups[screen].active = screen === data.screen || (showingIdeas && screen === 'galileo');
        }
        if (showingIdeas) {
            for (const child of this.groups.galileo.children) {
                child.active = child.name === 'Background' || child.name === 'Back';
            }
        }
        if (data.screen === 'galileo') this.refreshGalileo();
        else if (data.screen === 'ending') this.refreshEnding();
    }

    private refreshGalileo(): void {
        const d = this.data;
        const character = d.dialogueState === 'missing' ? 'CharacterMissing'
            : d.selectedClue ? 'CharacterOpinion' : 'CharacterIdle';
        this.active('Galileo/CharacterIdle', character === 'CharacterIdle');
        this.active('Galileo/CharacterOpinion', character === 'CharacterOpinion');
        this.active('Galileo/CharacterMissing', character === 'CharacterMissing');
        this.active('Galileo/ClickHint', d.dialogueState === 'quote');
        this.active('Galileo/PromptBubble', d.dialogueState === 'prompt');
        this.active('Galileo/OpenBookHint', this.allCollected() && d.notebookOpened);
        const notebookHandle = this.requireNode('Galileo/NotebookToggle');
        notebookHandle.setPosition(d.notebookOpened ? new Vec3(580, -60, 0) : new Vec3(1010, -60, 0));
        this.active('Galileo/NotebookToggle', true);
        for (const answerIndex of [0, 1, 2, 3]) {
            this.active(`Galileo/NotebookToggle/Answer${answerIndex}`,
                d.notebookOpened && d.dialogueState !== 'quote'
                && d.answerIndices.includes(answerIndex) && !d.deliveredAnswers.includes(answerIndex));
        }
        this.active('Galileo/UnansweredTitle', false);
        this.active('Galileo/NoAnswer', false);
        for (const clue of ['moon', 'jupiter', 'gravity'] as SceneThreeClue[]) {
            this.active(`Galileo/${this.capital(clue)}Dialogue`, false);
        }
        this.active('Galileo/RecordAnswer', false);
    }

    private refreshEnding(): void {
        const confess = this.data.ending === 'confess';
        this.active('Ending/ConfessBackground', confess);
        this.active('Ending/ConfessMessenger', confess);
        this.active('Ending/RefuseBackground', !confess);
        this.active('Ending/ExecutionFire', !confess);
        this.active('Ending/ExecutionText', !confess);
    }

    private bindInteractions(): void {
        for (const key of ['CharacterIdle', 'CharacterOpinion', 'CharacterMissing']) {
            this.touch(`Galileo/${key}`, () => this.actions.characterAction());
        }
        this.touch('Galileo/Back', () => this.actions.close());
        this.touch('Galileo/NotebookToggle', () => {
            this.actions.toggleNotebook();
        });
        this.touch('Galileo/OpenBookHint', () => this.actions.openBook());
        for (const answerIndex of [0, 1, 2, 3]) {
            this.bindAnswerDrag(answerIndex, `Galileo/NotebookToggle/Answer${answerIndex}`);
        }
        this.touch('Galileo/ClickHint', () => this.collectSelectedAnswer());
        this.touch('Galileo/RecordAnswer', () => this.collectSelectedAnswer());

        this.touch('Gravity/Back', () => this.actions.back());
        this.touch('Gravity/ThrowButton', () => { void this.playGravityExperiment(); });
        this.touch('Choice/Back', () => this.actions.back());
        this.touch('Choice/Confess', () => this.actions.chooseEnding('confess'));
        this.touch('Choice/Refuse', () => this.actions.chooseEnding('refuse'));
    }

    private async playGravityExperiment(): Promise<void> {
        const clip = await yy.AssetManager.loadVideo('Art', 'Video/Scene3/重力实验/落下动画');
        await yy.VideoManager.playLocalVideo({ clip });
        if (this.node.isValid) this.actions.gravityFinished();
    }

    private bindAnswerDrag(answerIndex: number, path: string): void {
        const node = this.requireNode(path);
        node.on(Node.EventType.TOUCH_START, event => this.onAnswerStart(answerIndex, node, event), this);
        node.on(Node.EventType.TOUCH_MOVE, event => this.onAnswerMove(answerIndex, event), this);
        node.on(Node.EventType.TOUCH_END, event => this.onAnswerEnd(answerIndex, event), this);
        node.on(Node.EventType.TOUCH_CANCEL, event => this.onAnswerCancel(answerIndex, event), this);
    }

    private onAnswerStart(answerIndex: number, node: Node, event: EventTouch): void {
        if (!this.data?.notebookOpened || this.data.deliveredAnswers.includes(answerIndex)
            || this.data.selectedAnswerIndex !== null) return;
        const point = this.touchPosition(event, node.parent);
        const drag = { node, start: node.position.clone(), offset: new Vec3() };
        drag.offset.set(point.x - node.position.x, point.y - node.position.y, 0);
        this.answerDrag.set(answerIndex, drag);
        event.propagationStopped = true;
    }

    private onAnswerMove(answerIndex: number, event: EventTouch): void {
        const drag = this.answerDrag.get(answerIndex);
        if (!drag) return;
        const point = this.touchPosition(event, drag.node.parent);
        drag.node.setPosition(point.x - drag.offset.x, point.y - drag.offset.y, drag.node.position.z);
        event.propagationStopped = true;
    }

    private onAnswerEnd(answerIndex: number, event: EventTouch): void {
        const drag = this.answerDrag.get(answerIndex);
        if (!drag) return;
        this.answerDrag.delete(answerIndex);
        event.propagationStopped = true;
        const rootPosition = this.positionInRoot(drag.node);
        const droppedOnCharacter = Math.abs(rootPosition.x + 285) < 330
            && Math.abs(rootPosition.y + 120) < 350;
        tween(drag.node).to(0.16, { position: drag.start.clone() })
            .call(() => { if (droppedOnCharacter) this.actions.ask(answerIndex); })
            .start();
    }

    private onAnswerCancel(answerIndex: number, event: EventTouch): void {
        const drag = this.answerDrag.get(answerIndex);
        if (!drag) return;
        this.answerDrag.delete(answerIndex);
        event.propagationStopped = true;
        tween(drag.node).to(0.16, { position: drag.start.clone() }).start();
    }

    private collectSelectedAnswer(): void {
        if (this.data?.selectedAnswerIndex !== null && this.data?.selectedAnswerIndex !== undefined
            && this.data.dialogueState === 'quote') {
            this.actions.collectAnswer(this.data.selectedAnswerIndex);
        }
    }

    private allCollected(): boolean {
        return this.data.answerIndices.length > 0
            && this.data.answerIndices.every(answerIndex => this.data.deliveredAnswers.includes(answerIndex));
    }

    private capital(value: string): string {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    private requireNode(path: string): Node {
        let node: Node = this.node;
        for (const segment of path.split('/')) node = node?.getChildByName(segment);
        if (!node) throw new Error(`SceneThree.prefab 缺少显示节点：${path}`);
        return node;
    }

    private active(path: string, active: boolean): void {
        this.requireNode(path).active = active;
    }

    private touch(path: string, action: () => void): void {
        this.requireNode(path).on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            action();
        }, this);
    }

    private touchPosition(event: EventTouch, parent: Node = this.node): Vec3 {
        const point = event.getUILocation();
        return parent.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(point.x, point.y, 0));
    }

    private positionInRoot(node: Node): Vec3 {
        return this.node.getComponent(UITransform).convertToNodeSpaceAR(node.worldPosition.clone());
    }

    private adaptToScreen(): void {
        if (!this.node.parent?.parent) return;
        const sceneRoot = this.node.parent;
        const size = sceneRoot.parent.getComponent(UITransform)?.contentSize;
        if (!size) return;
        sceneRoot.getComponent(UITransform)?.setContentSize(size);
        this.node.getComponent(UITransform)?.setContentSize(1920, 1080);
        const scale = Math.min(size.width / 1920, size.height / 1080);
        this.node.setScale(scale, scale, 1);
    }
}
