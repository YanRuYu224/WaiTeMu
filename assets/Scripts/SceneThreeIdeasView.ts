import { _decorator, BlockInputEvents, Component, EventTouch, Node, UITransform, view } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { showSceneThreeMessengerBirth } from './SceneThreeMessengerBirthView';

const { ccclass } = _decorator;

@ccclass('SceneThreeIdeasView')
export class SceneThreeIdeasView extends Component {
    private advancing = false;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.handleAdvance, this, true);
        view.on('canvas-resize', this.adaptToScreen, this);
        view.on('design-resolution-changed', this.adaptToScreen, this);
        this.adaptToScreen();
    }

    protected onDestroy(): void {
        this.node.off(Node.EventType.TOUCH_END, this.handleAdvance, this, true);
        view.off('canvas-resize', this.adaptToScreen, this);
        view.off('design-resolution-changed', this.adaptToScreen, this);
    }

    public open(): void {
        this.node.active = true;
        this.adaptToScreen();
    }

    private async handleAdvance(event: EventTouch): Promise<void> {
        event.propagationStopped = true;
        if (this.advancing) return;
        this.advancing = true;
        try {
            await showSceneThreeMessengerBirth();
            this.node.active = false;
        } finally {
            this.advancing = false;
        }
    }

    private adaptToScreen(): void {
        const size = this.node.parent?.getComponent(UITransform)?.contentSize;
        if (!size) return;
        this.node.getComponent(UITransform)?.setContentSize(size);
        const content = this.node.getChildByName('Content');
        if (!content) throw new Error('SceneThreeIdeas 预制体缺少 Content 节点');
        content.getComponent(UITransform)?.setContentSize(1920, 1080);
        const scale = Math.min(size.width / 1920, size.height / 1080);
        content.setScale(scale, scale, 1);
    }
}

export async function showSceneThreeIdeas(): Promise<void> {
    let node = yy.UI.getChildByName('SceneThreeIdeas');
    if (!node?.isValid) node = await yy.UIManager.ShowUI('Prefabs/SceneThreeIdeas', yy.UI);
    if (!node?.isValid) throw new Error('无法创建 SceneThreeIdeas 预制体');
    node.name = 'SceneThreeIdeas';
    node.layer = yy.UI.layer;
    node.setSiblingIndex(node.parent.children.length - 1);
    node.active = false;
    if (!node.getComponent(UITransform)) node.addComponent(UITransform).setContentSize(1920, 1080);
    if (!node.getComponent(BlockInputEvents)) node.addComponent(BlockInputEvents);
    const ideasView = node.getComponent(SceneThreeIdeasView) ?? node.addComponent(SceneThreeIdeasView);
    ideasView.open();
}
