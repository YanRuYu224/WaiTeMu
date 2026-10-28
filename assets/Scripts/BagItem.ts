import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { ItemType } from './Item';
const { ccclass, property } = _decorator;

@ccclass('BagItem')
export class BagItem extends Component {

    @property(SpriteFrame)
    item_sprites: SpriteFrame[] = [];

    @property(Sprite)
    item_sprite: Sprite = null;

    @property(SpriteFrame)
    light_sprites: SpriteFrame[] = [];

    @property(Sprite)
    light_sprite: Sprite = null;

    index = -1;

    protected onLoad(): void {
        this.item_sprite.node.on(Node.EventType.TOUCH_END, this.onTounchEnd, this);
        this.item_sprite.node.on(Node.EventType.MOUSE_ENTER, this.onEnterItem, this);
        this.item_sprite.node.on(Node.EventType.MOUSE_LEAVE, this.onLeaveItem, this);

        this.light_sprite.node.active = false;

        yy.EventCenter.addEventListener(yy.EventName.SET_BAG_ITEM_MOVE_STATE, this.setMoveState, this);
    }

    protected onDestroy(): void {
        yy.EventCenter.removeTargetListeners(this);
    }

    onTounchEnd() {
        if (!this.canMove) {
            this.index !== -1 && yy.EventCenter.dispatchEvent(yy.EventName.SHOW_ITEM_ANIMATION_DES, this.index);
        } else {
            this.index !== -1 && yy.EventCenter.dispatchEvent(yy.EventName.COLLECTION_ITEM_TO_DESK, this.index, this.item_sprite.node);
        }
    }

    init(index) {
        this.index = index;
        if (this.item_sprites[index]) {
            this.item_sprite.node.active = true;
            this.item_sprite.spriteFrame = this.item_sprites[index];
            this.light_sprite.spriteFrame = this.light_sprites[index] ?? null;
            this.light_sprite.node.active = false;

            // The gravity image has about three times the moon thumbnail's dimensions.
            const scale = index === ItemType.Gravity ? 0.331
                : index === ItemType.Moon || index === ItemType.Jupiter ? 1 : 0.3;
            this.item_sprite.node.setScale(scale, scale, 1);
        }
    }

    clear(): void {
        this.index = -1;
        this.item_sprite.spriteFrame = null;
        this.light_sprite.spriteFrame = null;
        this.light_sprite.node.active = false;
        this.item_sprite.node.active = false;
    }

    onEnterItem() {
        this.light_sprite.node.active = !!this.light_sprite.spriteFrame;
    }

    onLeaveItem() {
        this.light_sprite.node.active = false;
    }

    private canMove = false;
    setMoveState(boo) {
        this.canMove = boo;
    }
}


