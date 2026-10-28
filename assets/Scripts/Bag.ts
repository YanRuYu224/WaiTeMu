import { _decorator, Component, instantiate, Layout, Node, SpriteFrame, tween, UITransform, Vec3 } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { BagItem } from './BagItem';
import { ItemType } from './Item';
const { ccclass, property } = _decorator;

@ccclass('Bag')
export class Bag extends Component {

    @property(Node)
    content: Node = null;

    @property(SpriteFrame)
    sprite_frames: SpriteFrame[] = [];

    @property(Node)
    bag_close: Node = null;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onClickOpen, this);
        this.bag_close.on(Node.EventType.TOUCH_END, this.onClickClsoe, this);
        yy.EventCenter.addEventListener(yy.EventName.GIVE_BAG_ITEM, this.onGiveBagItem, this);
        this.ensureItemSlots();
        this.getBagItem();
        yy.UIManager.ShowUI("Prefabs/BagItemText", yy.Top);
    }

    protected onDestroy(): void {
        yy.EventCenter.removeTargetListeners(this);
    }

    onClickOpen() {
        if (this.node.children[0].position.y === 0) return;
        tween(this.node.children[0])
            .to(0.2, { position: new Vec3(0, 0) })
            .start();
    }

    onClickClsoe() {
        tween(this.node.children[0])
            .to(0.2, { position: new Vec3(0, 2000) })
            .start();
    }

    private ensureItemSlots(): void {
        const template = this.content.children[0];
        const missing = ItemType.Gravity + 1 - this.content.children.length;
        if (!template || missing <= 0) return;

        for (let i = 0; i < missing; i++) {
            const slot = instantiate(template);
            slot.name = `BagItem${this.content.children.length}`;
            this.content.addChild(slot);
        }

        const contentSize = this.content.getComponent(UITransform);
        const slotSize = template.getComponent(UITransform);
        const layout = this.content.getComponent(Layout);
        const spacing = layout?.spacingY ?? 0;
        if (contentSize && slotSize) {
            contentSize.setContentSize(
                contentSize.width,
                contentSize.height + missing * (slotSize.height + spacing),
            );
        }
        layout?.updateLayout(true);
    }

    getBagItem() {
        const itemArr: ItemType[] = yy.Storage.getObject(yy.StorageName.USER_BAG_ITEM, []);
        const ideaItems: ItemType[] = yy.Storage.getObject(yy.StorageName.SCENE_THREE_IDEA_ITEMS, []);
        const slots = this.content.children.map(node => node.getComponent(BagItem));
        slots.forEach(slot => slot.clear());
        let nextSlot = 0;
        for (const item of itemArr) {
            if (!ideaItems.includes(item) && typeof item === 'number' && item >= ItemType.Globe
                && item <= ItemType.Gravity && nextSlot < slots.length) {
                slots[nextSlot++].init(item);
            }
        }
    }

    onGiveBagItem(index: ItemType) {
        if (index < ItemType.Globe || index > ItemType.Gravity) return;
        if (this.content.children.some(node => node.getComponent(BagItem).index === index)) return;
        this.onClickOpen();
        for (let i = 0; i < this.content.children.length; ++i) {
            let comp = this.content.children[i].getComponent(BagItem);
            if (comp.index !== -1) {
                continue;
            } else {
                comp.init(index);
                break;
            }
        }
    }
}


