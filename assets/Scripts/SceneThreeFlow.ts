import { _decorator, Component, Node, UITransform } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { AristotleQuestion } from './AristotleQuestion';
import { showSceneThreeIdeas } from './SceneThreeIdeasView';
import { showSceneThreeGravityExperiment } from './SceneThreeGravityExperimentView';
import { SceneThreeClue, SceneThreeView, SceneThreeViewActions } from './SceneThreeView';
import { Item, ItemType } from './Item';

const { ccclass } = _decorator;
const RESPONSE_BY_ANSWER: Record<number, SceneThreeClue> = {
    0: 'jupiter',
    1: 'jupiter',
    2: 'moon',
    3: 'gravity',
};

/** Owns Scene 3 gameplay state and refreshes the separate presentation prefab. */
@ccclass('SceneThreeFlow')
export class SceneThreeFlow extends Component {
    private view: SceneThreeView = null;
    private onExit: (() => void) = null;
    private answerIndices: number[] = [];
    private deliveredAnswers: number[] = [];
    private notebookOpened = false;
    private selectedClue: SceneThreeClue | null = null;
    private selectedAnswerIndex: number | null = null;
    private characterClicked = false;
    private dialogueState: 'none' | 'missing' | 'prompt' | 'quote' | 'no-answer' = 'none';
    private ideasOpening = false;
    private gravityOpening = false;

    private readonly actions: SceneThreeViewActions = {
        close: () => this.close(),
        toggleNotebook: () => {
            this.notebookOpened = !this.notebookOpened;
            if (!this.notebookOpened) {
                this.selectedClue = null;
                this.selectedAnswerIndex = null;
                this.dialogueState = 'none';
            }
            this.refresh();
        },
        characterAction: () => this.onCharacterAction(),
        ask: answerIndex => this.ask(answerIndex),
    };

    public async open(onExit: () => void): Promise<void> {
        this.onExit = onExit;
        this.answerIndices = AristotleQuestion.getCollectedAnswerIndices();
        if (!this.view) {
            const content = this.node.getChildByName('Content');
            if (!content) throw new Error('SceneThree 预制体缺少 Content 显示节点');
            this.view = content.getComponent(SceneThreeView) ?? content.addComponent(SceneThreeView);
        }
        if (!this.node.isValid) return;
        this.node.active = true;
        this.view.initialize();
        if (Item.hasBeenCollected(ItemType.Gravity)) this.view.removeAnswer(3);
        if (Item.hasBeenCollected(ItemType.Jupiter)) this.view.removeAnswer(0);
        if (Item.hasBeenCollected(ItemType.Moon)) this.view.removeAnswer(2);
        this.refresh();
    }

    private refresh(): void {
        if (!this.view?.isValid) return;
        this.view.refresh({
            answerIndices: [...this.answerIndices],
            deliveredAnswers: [...this.deliveredAnswers],
            notebookOpened: this.notebookOpened,
            selectedClue: this.selectedClue,
            selectedAnswerIndex: this.selectedAnswerIndex,
            characterClicked: this.characterClicked,
            dialogueState: this.dialogueState,
        }, this.actions);
    }

    private onCharacterAction(): void {
        if (this.hasAllIdeaClues()) {
            void this.openIdeas();
            return;
        }
        if (this.dialogueState === 'prompt'
            && (this.selectedAnswerIndex === 0 || this.selectedAnswerIndex === 2)
            && this.selectedClue === RESPONSE_BY_ANSWER[this.selectedAnswerIndex]) return;
        if (this.dialogueState === 'prompt' && this.selectedAnswerIndex === 1
            && this.selectedClue === RESPONSE_BY_ANSWER[1]) return;
        if (this.dialogueState === 'prompt' && this.selectedAnswerIndex === 3
            && this.selectedClue === RESPONSE_BY_ANSWER[3]) {
            if (Item.hasBeenCollected(ItemType.Gravity)) return;
            void this.openGravityExperiment();
            return;
        }
        const firstClick = !this.characterClicked;
        this.characterClicked = true;
        if (this.dialogueState === 'missing') { this.dialogueState = 'none'; this.refresh(); return; }
        if (this.dialogueState === 'no-answer') { this.dialogueState = 'none'; this.refresh(); return; }
        if (this.dialogueState === 'quote') return;
        if (this.selectedAnswerIndex === null) {
            if (firstClick) this.refresh();
            return;
        }
        if (this.dialogueState === 'prompt') {
            this.dialogueState = 'quote';
            this.notebookOpened = false;
            this.refresh();
        }
    }

    private ask(answerIndex: number): void {
        if (!this.answerIndices.includes(answerIndex) || this.deliveredAnswers.includes(answerIndex)) return;
        this.deliveredAnswers.push(answerIndex);
        this.selectedClue = RESPONSE_BY_ANSWER[answerIndex];
        this.selectedAnswerIndex = answerIndex;
        this.dialogueState = 'prompt';
        this.refresh();
    }

    private hasAllIdeaClues(): boolean {
        return [ItemType.Moon, ItemType.Gravity, ItemType.Jupiter]
            .every(type => Item.hasBeenCollected(type));
    }

    private async openIdeas(): Promise<void> {
        if (this.ideasOpening) return;
        this.ideasOpening = true;
        try {
            await showSceneThreeIdeas();
        } finally {
            this.ideasOpening = false;
        }
    }

    private async openGravityExperiment(): Promise<void> {
        if (this.gravityOpening) return;
        this.gravityOpening = true;
        try {
            await showSceneThreeGravityExperiment();
        } finally {
            this.gravityOpening = false;
        }
    }

    private close(): void {
        this.node.active = false;
        const callback = this.onExit;
        this.onExit = null;
        callback?.();
    }
}

export async function showSceneThree(onExit: () => void): Promise<void> {
    let node = yy.UI.getChildByName('SceneThree');
    if (!node?.isValid) node = await yy.UIManager.ShowUI('Prefabs/SceneThree', yy.UI);
    if (!node?.isValid) throw new Error('无法创建 SceneThree 预制体');
    node.name = 'SceneThree';
    node.layer = yy.UI.layer;
    node.setSiblingIndex(node.parent.children.length - 1);
    if (!node.getComponent(UITransform)) node.addComponent(UITransform).setContentSize(1920, 1080);
    const flow = node.getComponent(SceneThreeFlow) ?? node.addComponent(SceneThreeFlow);
    await flow.open(onExit);
}
