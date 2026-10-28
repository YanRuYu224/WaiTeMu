import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DoorLeft')
export class DoorLeft extends Component {
    @property(Node)
    back: Node = null;

    protected onLoad(): void {
        this.back.on(Node.EventType.TOUCH_END, this.onClick, this);
    }

    onClick() {
        this.node.active = false;
    }

}


