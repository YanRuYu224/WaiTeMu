import { _decorator, Component, Label, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('BeforeDoorDialog')
export class BeforeDoorDialog extends Component {

    @property(Node)
    door: Node = null;

    protected onLoad(): void {
        this.door.on(Node.EventType.TOUCH_END, this.onClick, this);
        yy.Storage.clear();
    }

    async onClick() {
        await yy.VideoManager.playLocalVideo({ clip: await yy.AssetManager.loadVideo("Art", "Video/开门动画") });
        this.node.destroy();
        await yy.UIManager.ShowUI("Prefabs/DoorMainDialog", yy.UI);
    }

}


