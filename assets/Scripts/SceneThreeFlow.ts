import { _decorator, Component, Node, UITransform } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { AristotleQuestion } from './AristotleQuestion';
import {
    SceneThreeClue, SceneThreeScreen, SceneThreeView, SceneThreeViewActions,
} from './SceneThreeView';

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
    private currentScreen: SceneThreeScreen = 'galileo';
    private onExit: (() => void) = null;
    private gravityDone = false;
    private answerIndices: number[] = [];
    private deliveredAnswers: number[] = [];
    private notebookOpened = false;
    private selectedClue: SceneThreeClue | null = null;
    private selectedAnswerIndex: number | null = null;
    private dialogueState: 'none' | 'missing' | 'prompt' | 'quote' | 'no-answer' = 'none';
    private ending: 'confess' | 'refuse' | null = null;
    private endingPlaying = false;
    private hasOpened = false;

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
        openBook: () => this.go('choice'),
        ask: answerIndex => this.ask(answerIndex),
        showNoAnswer: () => { this.selectedClue = null; this.dialogueState = 'no-answer'; this.go('galileo'); },
        collectAnswer: answerIndex => this.collectAnswer(answerIndex),
        gravityFinished: () => { this.gravityDone = true; this.selectedClue = 'gravity'; this.dialogueState = 'prompt'; this.go('galileo'); },
        chooseEnding: kind => { void this.playEnding(kind); },
        back: () => this.go('galileo'),
    };

    public async open(onExit: () => void): Promise<void> {
        this.onExit = onExit;
        this.answerIndices = AristotleQuestion.getCollectedAnswerIndices();
        if (!this.view) {
            const content = this.node.getChildByName('Content');
            if (!content) throw new Error('SceneThree 预制体缺少 Content 显示节点');
            this.view = content.getComponent(SceneThreeView) ?? content.addComponent(SceneThreeView);
        }
        this.view.initialize();
        if (!this.node.isValid) return;
        this.node.active = true;
        if (this.hasOpened) this.refresh();
        else {
            this.hasOpened = true;
            this.go('galileo');
        }
    }

    private refresh(): void {
        if (!this.view?.isValid) return;
        this.view.refresh({
            screen: this.currentScreen,
            gravityDone: this.gravityDone,
            answerIndices: [...this.answerIndices],
            deliveredAnswers: [...this.deliveredAnswers],
            notebookOpened: this.notebookOpened,
            selectedClue: this.selectedClue,
            selectedAnswerIndex: this.selectedAnswerIndex,
            dialogueState: this.dialogueState,
            ending: this.ending,
        }, this.actions);
    }

    private go(screen: SceneThreeScreen): void {
        this.currentScreen = screen;
        this.refresh();
    }

    private onCharacterAction(): void {
        if (this.dialogueState === 'missing') { this.dialogueState = 'none'; this.refresh(); return; }
        if (this.dialogueState === 'no-answer') { this.dialogueState = 'none'; this.go('galileo'); return; }
        if (this.dialogueState === 'quote') { this.go('ideas'); return; }
        if (this.selectedAnswerIndex === null) return;
        if (this.dialogueState === 'prompt') {
            this.dialogueState = 'quote';
            this.notebookOpened = false;
            this.refresh();
        }
    }

    private ask(answerIndex: number): void {
        if (!this.answerIndices.includes(answerIndex) || this.deliveredAnswers.includes(answerIndex)) return;
        this.selectedClue = RESPONSE_BY_ANSWER[answerIndex];
        this.selectedAnswerIndex = answerIndex;
        this.dialogueState = 'prompt';
        this.go('galileo');
    }

    private collectAnswer(answerIndex: number): void {
        if (!this.answerIndices.includes(answerIndex) || this.deliveredAnswers.includes(answerIndex)) return;
        this.deliveredAnswers.push(answerIndex);
        this.selectedClue = null;
        this.selectedAnswerIndex = null;
        this.dialogueState = 'none';
        this.refresh();
    }

    private async playEnding(kind: 'confess' | 'refuse'): Promise<void> {
        if (this.endingPlaying) return;
        this.endingPlaying = true;
        this.ending = kind;
        try {
            const path = kind === 'confess' ? 'Video/Scene3/认错结局/烧书' : 'Video/Scene3/结局/被烧死结局/异端火';
            const clip = await yy.AssetManager.loadVideo('Art', path);
            await yy.VideoManager.playLocalVideo({ clip });
            if (this.node.isValid) this.go('ending');
        } finally {
            this.endingPlaying = false;
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
