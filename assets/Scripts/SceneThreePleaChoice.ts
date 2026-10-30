import { _decorator, Component, game, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('SceneThreePleaChoice')
export class SceneThreePleaChoice extends Component {

    @property(Node)
    error: Node = null;

    @property(Node)
    no_error: Node = null;

    protected onLoad(): void {
        this.error.on(Node.EventType.TOUCH_END, this.onError, this);
        this.no_error.on(Node.EventType.TOUCH_END, this.onNoError, this);
    }

    protected onDestroy(): void {
        this.error.off(Node.EventType.TOUCH_END, this.onError, this);
        this.no_error.off(Node.EventType.TOUCH_END, this.onNoError, this);
    }

    async onError() {
        const clip = await yy.AssetManager.loadVideo('Art', 'Video/烧书');
        await yy.VideoManager.playLocalVideo({ clip });
        game.end();
    }

    async onNoError() {
        const clip = await yy.AssetManager.loadVideo('Art', 'Video/异端火');
        await yy.VideoManager.playLocalVideo({ clip });
        game.end();
    }
}


