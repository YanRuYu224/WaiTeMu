import { _decorator, Component, Enum, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

export enum ItemType {
    Globe = 0,//地球仪
    Celestial = 1,//天体论
    Astronomy = 2,//天文对话
    Telescope = 3,//望远镜
    Messenger = 4,//星界使者
    Moon = 5,//月球线索
    Jupiter = 6,//木星线索
    Gravity = 7,//重力线索
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
        this.node.active = !Item.hasBeenCollected(this.item_type);
    }

    onEnterItem() {
        this.node.children[0].active = true;
    }

    onLeaveItem() {
        this.node.children[0].active = false;
    }

    onClickSelf() {
        Item.giveToBag(this.item_type);
        this.node.active = false;
    }

    static giveToBag(type: ItemType): boolean {
        const items: ItemType[] = yy.Storage.getObject(yy.StorageName.USER_BAG_ITEM, []);
        if (Item.hasBeenCollected(type)) return false;

        items.push(type);
        if (!yy.Storage.setObject(yy.StorageName.USER_BAG_ITEM, items)) return false;
        yy.EventCenter.dispatchEvent(yy.EventName.GIVE_BAG_ITEM, type);
        return true;
    }

    static hasBeenCollected(type: ItemType): boolean {
        const bagItems: ItemType[] = yy.Storage.getObject(yy.StorageName.USER_BAG_ITEM, []);
        const ideaItems: ItemType[] = yy.Storage.getObject(yy.StorageName.SCENE_THREE_IDEA_ITEMS, []);
        return bagItems.includes(type) || ideaItems.includes(type);
    }

}


