import { _decorator, BlockInputEvents, Component, EventTouch, Node, UITransform, view } from 'cc';
import { yy } from '../Pioneer/Pioneer';

const { ccclass } = _decorator;

@ccclass('SceneThreeMessengerBirthView')
export class SceneThreeMessengerBirthView extends Component {
    private book: Node = null;
    private playing = false;

    protected onLoad(): void {
        const content = this.node.getChildByName('Content');
        const panel = content?.getChildByName('BookPanel');
        if (!panel) throw new Error('SceneThreeMessengerBirth 预制体缺少 BookPanel 节点');
        this.book = panel.getChildByName('Book');
        if (!this.book) throw new Error('SceneThreeMessengerBirth 预制体缺少 Book 节点');
        this.book.on(Node.EventType.TOUCH_END, this.playDenialVideo, this);

        view.on('canvas-resize', this.adaptToScreen, this);
        view.on('design-resolution-changed', this.adaptToScreen, this);
        this.adaptToScreen();
    }

    protected onDestroy(): void {
        this.book?.off(Node.EventType.TOUCH_END, this.playDenialVideo, this);
        view.off('canvas-resize', this.adaptToScreen, this);
        view.off('design-resolution-changed', this.adaptToScreen, this);
    }

    private async playDenialVideo(event: EventTouch): Promise<void> {
        event.propagationStopped = true;
        if (this.playing) return;
        this.playing = true;
        try {
            const clip = await yy.AssetManager.loadVideo('Art', 'Video/Scene3/否定动画/否定动画');
            await yy.VideoManager.playLocalVideo({ clip });
            await yy.UIManager.ShowUI('Prefabs/SceneThreePleaChoice', yy.UI);
        } finally {
            this.playing = false;
        }
    }

    public open(): void {
        this.node.active = true;
        this.adaptToScreen();
    }

    private adaptToScreen(): void {
        const size = this.node.parent?.getComponent(UITransform)?.contentSize;
        if (!size) return;
        this.node.getComponent(UITransform)?.setContentSize(size);
        const content = this.node.getChildByName('Content');
        if (!content) throw new Error('SceneThreeMessengerBirth 预制体缺少 Content 节点');
        content.getComponent(UITransform)?.setContentSize(1920, 1080);
        const scale = Math.min(size.width / 1920, size.height / 1080);
        content.setScale(scale, scale, 1);
    }
}

export async function showSceneThreeMessengerBirth(): Promise<void> {
    let node = yy.UI.getChildByName('SceneThreeMessengerBirth');
    if (!node?.isValid) node = await yy.UIManager.ShowUI('Prefabs/SceneThreeMessengerBirth', yy.UI);
    if (!node?.isValid) throw new Error('无法创建 SceneThreeMessengerBirth 预制体');
    node.name = 'SceneThreeMessengerBirth';
    node.layer = yy.UI.layer;
    node.setSiblingIndex(node.parent.children.length - 1);
    node.active = false;
    if (!node.getComponent(UITransform)) node.addComponent(UITransform).setContentSize(1920, 1080);
    if (!node.getComponent(BlockInputEvents)) node.addComponent(BlockInputEvents);
    const birthView = node.getComponent(SceneThreeMessengerBirthView)
        ?? node.addComponent(SceneThreeMessengerBirthView);
    birthView.open();
}
