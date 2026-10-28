import { _decorator, BlockInputEvents, Component, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('SceneThreeGravityExperiment')
export class SceneThreeGravityExperiment extends Component {
    private playing = false;

    @property(Node)
    one_kg: Node = null;

    @property(Node)
    ten_kg: Node = null;

    protected onLoad(): void {
        this.one_kg.on(Node.EventType.TOUCH_START, this.onClick, this);
        this.ten_kg.on(Node.EventType.TOUCH_START, this.onClick, this);
    }

    protected onDestroy(): void {
        this.one_kg.off(Node.EventType.TOUCH_START, this.onClick, this);
        this.ten_kg.off(Node.EventType.TOUCH_START, this.onClick, this);
    }

    async onClick(): Promise<void> {
        if (this.playing) return;
        this.playing = true;
        try {
            const clip = await yy.AssetManager.loadVideo('Art', 'Video/落下动画');
            await yy.VideoManager.playLocalVideo({ clip });
            const result = await yy.UIManager.ShowUI('Prefabs/SceneThreeGravityResult', yy.UI);
            if (!result?.isValid) throw new Error('无法创建 SceneThreeGravityResult 预制体');
            result.layer = yy.UI.layer;
            result.setSiblingIndex(result.parent.children.length - 1);
            if (!result.getComponent(BlockInputEvents)) result.addComponent(BlockInputEvents);
            this.node.active = false;
        } finally {
            this.playing = false;
        }
    }
}


