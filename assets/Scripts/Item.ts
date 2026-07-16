import { _decorator, Component, Enum, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

enum ItemType {
    Globe = 0,//地球仪
    Celestial = 1,//天体论
    Astronomy = 2,//天文对话
    Telescope = 3,//望远镜
    Messenger = 4,//星界使者
}

@ccclass('Item')
export class Item extends Component {

    @property({ type: Enum(ItemType) })
    item_type: ItemType = ItemType.Globe;

    protected onLoad(): void {
        this.node.on(Node.EventType.MOUSE_ENTER, this.onEnterItem, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.onLeaveItem, this);
        this.node.on(Node.EventType.TOUCH_END, this.onClickSelf, this);

        this.node.children[0].active = false;
        this.node.active = !yy.Storage.getObject(yy.StorageName.USER_BAG_ITEM, []).includes(this.item_type);
    }

    onEnterItem() {
        this.node.children[0].active = true;
    }

    onLeaveItem() {
        this.node.children[0].active = false;
    }

    onClickSelf() {
        let arr = yy.Storage.getObject(yy.StorageName.USER_BAG_ITEM, []);
        arr.push(this.item_type);
        yy.Storage.setObject(yy.StorageName.USER_BAG_ITEM, arr);
        yy.EventCenter.emit(yy.EventName.GIVE_BAG_ITEM, this.item_type);
        this.node.active = false;
    }
}


