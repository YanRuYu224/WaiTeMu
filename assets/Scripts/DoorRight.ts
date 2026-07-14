import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('DoorRight')
export class DoorRight extends Component {
    @property(Node)
    back: Node = null;

    protected onLoad(): void {
        this.back.on(Node.EventType.MOUSE_UP, this.onClick, this);
    }

    onClick() {
        this.node.destroy();
    }

}


