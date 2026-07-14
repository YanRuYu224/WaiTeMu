import { Vec3 } from 'cc';
import { tween } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { Pioneer } from '../Pioneer/Pioneer';
import { Sprite } from 'cc';
import { SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Bag')
export class Bag extends Component {

    @property(Node)
    content: Node = null;

    @property(SpriteFrame)
    sprite_frames: SpriteFrame[] = [];

    protected onLoad(): void {
        this.node.on(Node.EventType.MOUSE_UP, this.onClickBag, this);

        Pioneer.instance.EventCenter.on(Pioneer.instance.EventName.GIVE_BAG_ITEM, this.onGiveBagItem, this);
    }

    onClickBag() {
        if (this.node.children[0].position.y === 0) {
            tween(this.node.children[0])
                .to(0.2, { position: new Vec3(0, 2000) })
                .start();
        } else {
            tween(this.node.children[0])
                .to(0.2, { position: new Vec3(0, 0) })
                .start();
        }
    }

    onGiveBagItem(index) {
        for (let i = 0; i < this.content.children.length; ++i) {
            if (this.content.children[i].children[0].getComponent(Sprite).spriteFrame) {
                continue;
            } else {
                this.content.children[i].children[0].getComponent(Sprite).spriteFrame = this.sprite_frames[index];
                break;
            }
        }
    }
}


