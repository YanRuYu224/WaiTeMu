import { _decorator, Component, Node, Sprite, SpriteFrame, tween, Vec3 } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { BagItem } from './BagItem';
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
        yy.EventCenter.on(yy.EventName.SET_BAG_STATE, this.setState, this);
        yy.EventCenter.on(yy.EventName.GIVE_BAG_ITEM, this.onGiveBagItem, this);
        yy.EventCenter.on(yy.EventName.DESTROY_BAG, () => { this.node.destroy(); }, this);
        this.getBagItem();
        yy.UIManager.ShowUI("Prefabs/BagItemText", yy.Top);
    }

    protected onDestroy(): void {
        yy.EventCenter.off(yy.EventName.SET_BAG_STATE, this.setState);
        yy.EventCenter.off(yy.EventName.GIVE_BAG_ITEM, this.onGiveBagItem);
    }

    onClickOpen() {
        tween(this.node.children[0])
            .to(0.2, { position: new Vec3(0, 0) })
            .start();
    }

    onClickClsoe() {
        tween(this.node.children[0])
            .to(0.2, { position: new Vec3(0, 2000) })
            .start();
    }

    getBagItem() {
        let itemArr = yy.Storage.getObject(yy.StorageName.USER_BAG_ITEM, []);
        for (let i = 0; i < this.content.children.length; ++i) {
            if (itemArr[i]) {
                this.content.children[i].getComponent(BagItem).init(itemArr[i]);
            }
        }
    }

    setState(state) {
        this.node && (this.node.active = state);
    }

    onGiveBagItem(index) {
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


