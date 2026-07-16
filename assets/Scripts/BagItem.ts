import { _decorator, Collider2D, Component, Contact2DType, Node, Sprite, SpriteFrame, UITransform, Vec3 } from 'cc';
import { yy } from '../Pioneer/Pioneer';
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

        yy.EventCenter.on(yy.EventName.SET_BAG_ITEM_MOVE_STATE, this.setMoveState, this);
    }

    protected onDestroy(): void {
        yy.EventCenter.off(yy.EventName.SET_BAG_ITEM_MOVE_STATE, this.setMoveState);
    }

    onTounchEnd() {
        if (!this.canMove) {
            this.index !== -1 && yy.EventCenter.emit(yy.EventName.SHOW_ITEM_ANIMATION_DES, this.index);
        } else {
            this.index !== -1 && yy.EventCenter.emit(yy.EventName.COLLECTION_ITEM_TO_DESK, this.index, this.item_sprite.node);
        }
    }

    init(index) {
        this.index = index;
        if (this.item_sprites[index]) {
            this.item_sprite.spriteFrame = this.item_sprites[index];
            this.light_sprite.spriteFrame = this.light_sprites[index];
        }
    }

    onEnterItem() {
        this.light_sprite.node.active = true;
    }

    onLeaveItem() {
        this.light_sprite.node.active = false;
    }

    private canMove = false;
    setMoveState(boo) {
        this.canMove = boo;
    }
}


