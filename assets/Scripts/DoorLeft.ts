import { _decorator, Component, Node, Vec3 } from 'cc';
import { Pioneer } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('DoorLeft')
export class DoorLeft extends Component {
    @property(Node)
    back: Node = null;

    @property(Node)
    globe: Node = null;

    @property(Node)
    book: Node = null;

    protected onLoad(): void {
        this.back.on(Node.EventType.MOUSE_UP, this.onClick, this);

        this.globe.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.globe), this);
        this.globe.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.globe), this);
        this.globe.on(Node.EventType.MOUSE_UP, this.onClickGlobe, this);

        this.book.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.book), this);
        this.book.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.book), this);
        this.book.on(Node.EventType.MOUSE_UP, this.onClickBook, this);
    }

    onClick() {
        Pioneer.instance.EventCenter.emit(Pioneer.instance.EventName.SET_BAG_STATE, false);
        this.node.destroy();
    }



    onClickGlobe() {
        Pioneer.instance.EventCenter.emit(Pioneer.instance.EventName.GIVE_BAG_ITEM, 0);
        this.globe.active = false;
    }

    onClickBook() {
        Pioneer.instance.EventCenter.emit(Pioneer.instance.EventName.GIVE_BAG_ITEM, 1);
        this.book.active = false;
    }

    onEnterDoor(node: Node) {
        node.children[0].active = true;
    }

    onLeaveDoor(node: Node) {
        node.children[0].active = false;
    }

}


