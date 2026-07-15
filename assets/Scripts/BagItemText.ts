import { _decorator, Component, Node, Sprite, SpriteFrame, Animation } from 'cc';
import { yy } from '../Pioneer/Pioneer';
import { playAniSync } from '../Pioneer/Utils';
const { ccclass, property } = _decorator;

@ccclass('BagItemText')
export class BagItemText extends Component {
    @property(SpriteFrame)
    des_sprites: SpriteFrame[] = [];

    @property(Sprite)
    des_sprite: Sprite = null;

    @property(Animation)
    des_ani: Animation = null;

    protected onLoad(): void {
        yy.EventCenter.on(yy.EventName.SHOW_ITEM_ANIMATION_DES, this.playAni, this);
    }

    protected onDestroy(): void {
        yy.EventCenter.off(yy.EventName.SHOW_ITEM_ANIMATION_DES, this.playAni);
    }

    isPlay = false;
    playAni(index) {
        if (!this.des_sprites[index] || this.isPlay) return;
        this.des_sprite.spriteFrame = this.des_sprites[index];
        this.isPlay = true;
        playAniSync(this.des_ani).then(() => {
            this.isPlay = false;
        })
    }
}


