import { _decorator, Component, Node, Sprite, SpriteFrame, Animation } from 'cc';
import { playAniSync } from '../Pioneer/Utils';
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
        this.item_sprite.node.on(Node.EventType.TOUCH_END, this.onClickSprite, this);
        this.item_sprite.node.on(Node.EventType.MOUSE_ENTER, this.onEnterItem, this);
        this.item_sprite.node.on(Node.EventType.MOUSE_LEAVE, this.onLeaveItem, this);

        yy.UIManager.ShowUI("Prefabs/BagItemText", yy.Top);
        this.light_sprite.node.active = false;
    }

    protected onDestroy(): void {
        this.item_sprite.node.off(Node.EventType.TOUCH_END, this.onClickSprite, this);
    }

    onClickSprite() {
        this.index !== -1 && yy.EventCenter.emit(yy.EventName.SHOW_ITEM_ANIMATION_DES, this.index);
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
}


