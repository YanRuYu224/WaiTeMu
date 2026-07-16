import { _decorator, Component, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('DoorLeft')
export class DoorLeft extends Component {
    @property(Node)
    back: Node = null;

    protected onLoad(): void {
        this.back.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    onClick() {
        yy.EventCenter.emit(yy.EventName.SET_BAG_STATE, false);
        this.node.active = false;
    }

}


