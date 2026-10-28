import { _decorator, Component, Node, UITransform, view } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { Item, ItemType } from './Item';
import {
    SceneThreeObservation, SceneThreeTelescopeActions, SceneThreeTelescopeView,
} from './SceneThreeTelescopeView';

const { ccclass } = _decorator;

/** Owns telescope observations while SceneThreeTelescopeView refreshes the authored prefab. */
@ccclass('SceneThreeTelescopeFlow')
export class SceneThreeTelescopeFlow extends Component {
    private view: SceneThreeTelescopeView = null;
    private onExit: (() => void) = null;
    private observedMoon = false;
    private observedJupiter = false;
    private viewingClue: SceneThreeObservation | null = null;

    private readonly actions: SceneThreeTelescopeActions = {
        close: () => this.close(),
        observationShown: clue => {
            this.viewingClue = clue;
            this.refresh();
        },
        observationCollected: clue => this.collectObservation(clue),
    };

    protected onLoad(): void {
        view.on('canvas-resize', this.adaptToScreen, this);
        view.on('design-resolution-changed', this.adaptToScreen, this);
        this.adaptToScreen();
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.adaptToScreen, this);
        view.off('design-resolution-changed', this.adaptToScreen, this);
    }

    public open(onExit: () => void): void {
        this.onExit = onExit;
        this.observedMoon = Item.hasBeenCollected(ItemType.Moon);
        this.observedJupiter = Item.hasBeenCollected(ItemType.Jupiter);
        this.node.active = true;
        if (!this.view) {
            this.view = this.getComponent(SceneThreeTelescopeView)
                || this.addComponent(SceneThreeTelescopeView);
        }
        this.refresh();
    }

    private refresh(): void {
        if (!this.view?.isValid) return;
        this.view.refresh({
            observedMoon: this.observedMoon,
            observedJupiter: this.observedJupiter,
            viewingClue: this.viewingClue,
        }, this.actions);
    }

    private collectObservation(clue: SceneThreeObservation): void {
        if (clue === 'moon' ? this.observedMoon : this.observedJupiter) return;
        if (clue === 'moon') this.observedMoon = true;
        else this.observedJupiter = true;
        this.viewingClue = null;
        this.refresh();

        const type = clue === 'moon' ? ItemType.Moon : ItemType.Jupiter;
        Item.giveToBag(type);
    }

    private close(): void {
        this.node.active = false;
        const callback = this.onExit;
        this.onExit = null;
        callback?.();
    }

    private adaptToScreen(): void {
        const parent = this.node.parent;
        const size = parent?.getComponent(UITransform)?.contentSize;
        if (!size) return;
        this.node.getComponent(UITransform)?.setContentSize(1920, 1080);
        const scale = Math.min(size.width / 1920, size.height / 1080);
        this.node.setScale(scale, scale, 1);
    }
}

export async function showSceneThreeTelescope(onExit: () => void): Promise<void> {
    let node = yy.UI.getChildByName('SceneThreeTelescope');
    if (!node?.isValid) {
        node = await yy.UIManager.ShowUI('Prefabs/SceneThreeTelescope', yy.UI);
    }
    if (!node?.isValid) throw new Error('无法创建 SceneThreeTelescope 预制体');
    node.name = 'SceneThreeTelescope';
    node.layer = yy.UI.layer;
    node.setSiblingIndex(node.parent.children.length - 1);
    if (!node.getComponent(UITransform)) node.addComponent(UITransform).setContentSize(1920, 1080);
    const flow = node.getComponent(SceneThreeTelescopeFlow) ?? node.addComponent(SceneThreeTelescopeFlow);
    flow.open(onExit);
}
