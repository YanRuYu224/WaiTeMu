import { _decorator, Component, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('DoorMainDialog')
export class DoorMainDialog extends Component {
    @property(Node)
    door_left: Node = null;

    @property(Node)
    door_right: Node = null;

    @property(Node)
    door_middle: Node = null;

    @property(Node)
    type_write: Node = null;

    protected onLoad(): void {
        this.door_left.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.door_left), this);
        this.door_left.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.door_left), this);
        this.door_left.on(Node.EventType.TOUCH_END, this.onClickLeft, this);

        this.door_middle.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.door_middle), this);
        this.door_middle.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.door_middle), this);
        this.door_middle.on(Node.EventType.TOUCH_END, this.onClickMiddle, this);

        this.door_right.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.door_right), this);
        this.door_right.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.door_right), this);
        this.door_right.on(Node.EventType.TOUCH_END, this.onClickRight, this);

        yy.UIManager.ShowUI("Prefabs/Bag", yy.Top).then((node) => {
            yy.EventCenter.dispatchEvent(yy.EventName.SET_BAG_STATE, false);
        });

        // yy.UIManager.ShowUI("Prefabs/NoteBook", yy.Top);
    }

    onEnterDoor(node: Node) {
        node.children[0].active = true;
    }

    onLeaveDoor(node: Node) {
        node.children[0].active = false;
    }

    onClickRight() {
        yy.EventCenter.dispatchEvent(yy.EventName.SET_BAG_STATE, true);
        yy.UIManager.ShowUI("Prefabs/DoorRight");
    }

    onClickLeft() {
        yy.EventCenter.dispatchEvent(yy.EventName.SET_BAG_STATE, true);
        yy.UIManager.ShowUI("Prefabs/DoorLeft");
    }

    onClickMiddle() {
        yy.EventCenter.dispatchEvent(yy.EventName.SET_BAG_STATE, true);
        yy.UIManager.ShowUI("Prefabs/DoorMiddle");
    }
}


