import {
    _decorator, Component, EventTouch, Node, tween, UITransform, Vec2, Vec3, view,
} from 'cc';

const { ccclass } = _decorator;
const ANSWERS_WITH_OWN_BUBBLE = new Set([0, 1, 2, 3]);
export type SceneThreeClue = 'moon' | 'jupiter' | 'gravity';

export interface SceneThreeViewData {
    answerIndices: number[];
    deliveredAnswers: number[];
    notebookOpened: boolean;
    selectedClue: SceneThreeClue | null;
    selectedAnswerIndex: number | null;
    characterClicked: boolean;
    dialogueState: 'none' | 'missing' | 'prompt' | 'quote' | 'no-answer';
}

export interface SceneThreeViewActions {
    close(): void;
    toggleNotebook(): void;
    characterAction(): void;
    ask(answerIndex: number): void;
}

/** Presentation adapter for the authored SceneThree prefab. It never creates UI nodes. */
@ccclass('SceneThreeView')
export class SceneThreeView extends Component {
    private data: SceneThreeViewData = null;
    private actions: SceneThreeViewActions = null;
    private galileo: Node = null;
    private readonly answerDrag = new Map<number, { node: Node; start: Vec3; offset: Vec3 }>();
    private readonly removedAnswers = new Set<number>();

    protected onLoad(): void {
        this.galileo = this.requireNode('Galileo');
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

    public removeAnswer(answerIndex: number): void {
        if (this.removedAnswers.has(answerIndex)) return;
        const answer = this.requireNode('Galileo/NotebookToggle')
            .getChildByName(`Answer${answerIndex}`);
        if (!answer) return;
        this.removedAnswers.add(answerIndex);
        this.answerDrag.delete(answerIndex);
        answer.removeFromParent();
        answer.destroy();
    }

    public isPointOnCharacter(point: Vec2): boolean {
        const character = ['CharacterIdle', 'CharacterOpinion', 'CharacterMissing']
            .map(name => this.requireNode(`Galileo/${name}`)).find(node => node.activeInHierarchy);
        return character?.getComponent(UITransform)?.getBoundingBoxToWorld().contains(point) ?? false;
    }

    public refresh(data: SceneThreeViewData, actions: SceneThreeViewActions): void {
        this.data = data;
        this.actions = actions;
        this.galileo.active = true;
        this.refreshGalileo();
    }

    private refreshGalileo(): void {
        const d = this.data;
        const answerResponseShown = d.dialogueState === 'prompt'
            && d.selectedAnswerIndex !== null && ANSWERS_WITH_OWN_BUBBLE.has(d.selectedAnswerIndex);
        const character = d.dialogueState === 'missing' ? 'CharacterMissing'
            : d.selectedClue ? 'CharacterOpinion' : 'CharacterIdle';
        this.active('Galileo/CharacterIdle', character === 'CharacterIdle');
        this.active('Galileo/CharacterOpinion', character === 'CharacterOpinion');
        this.active('Galileo/CharacterMissing', character === 'CharacterMissing');
        this.active('Galileo/ClickHint', !d.characterClicked && d.dialogueState === 'none');
        this.active('Galileo/PromptBubble', (d.dialogueState === 'prompt' && !answerResponseShown)
            || (d.characterClicked && d.dialogueState === 'none'));
        this.active('Galileo/Answer0Bubble', answerResponseShown && d.selectedAnswerIndex === 0);
        this.active('Galileo/Answer1Bubble', answerResponseShown && d.selectedAnswerIndex === 1);
        this.active('Galileo/Answer2Bubble', answerResponseShown && d.selectedAnswerIndex === 2);
        this.active('Galileo/Answer3Bubble', answerResponseShown && d.selectedAnswerIndex === 3);
        this.active('Galileo/OpenBookHint', false);
        const notebookHandle = this.requireNode('Galileo/NotebookToggle');
        notebookHandle.setPosition(d.notebookOpened ? new Vec3(580, -60, 0) : new Vec3(1010, -60, 0));
        this.active('Galileo/NotebookToggle', true);
        for (const answerIndex of [0, 1, 2, 3]) {
            const answerNode = notebookHandle.getChildByName(`Answer${answerIndex}`);
            if (ANSWERS_WITH_OWN_BUBBLE.has(answerIndex) && !answerNode?.isValid) continue;
            if (!answerNode?.isValid) throw new Error(`SceneThree.prefab 缺少显示节点：Answer${answerIndex}`);
            answerNode.active = d.notebookOpened && d.dialogueState !== 'quote'
                && d.answerIndices.includes(answerIndex) && !d.deliveredAnswers.includes(answerIndex)
                && !(answerIndex === d.selectedAnswerIndex && answerResponseShown);
        }
        this.active('Galileo/UnansweredTitle', false);
        this.active('Galileo/NoAnswer', false);
        for (const clue of ['moon', 'jupiter', 'gravity'] as SceneThreeClue[]) {
            this.active(`Galileo/${this.capital(clue)}Dialogue`, false);
        }
    }

    private bindInteractions(): void {
        for (const key of ['CharacterIdle', 'CharacterOpinion', 'CharacterMissing']) {
            this.touch(`Galileo/${key}`, () => this.actions.characterAction());
        }
        this.touch('Galileo/Back', () => this.actions.close());
        this.touch('Galileo/NotebookToggle', () => {
            this.actions.toggleNotebook();
        });
        for (const answerIndex of [0, 1, 2, 3]) {
            this.bindAnswerDrag(answerIndex, `Galileo/NotebookToggle/Answer${answerIndex}`);
        }
        this.touch('Galileo/ClickHint', () => this.actions.characterAction());

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
        const droppedOnCharacter = this.isPointOnCharacter(event.getUILocation());
        if (droppedOnCharacter && ANSWERS_WITH_OWN_BUBBLE.has(answerIndex)) {
            this.actions.ask(answerIndex);
            this.removeAnswer(answerIndex);
            return;
        }
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
