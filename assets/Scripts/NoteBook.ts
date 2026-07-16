import { _decorator, Component, Node, Animation, NodeEventType, tween, Vec3 } from 'cc';
import { playAniSync } from '../Pioneer/Utils';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('NoteBook')
export class NoteBook extends Component {
    @property(Animation)
    ani: Animation = null;

    protected onLoad(): void {
        this.node.on(NodeEventType.TOUCH_END, this.onTounchEnd, this);
    }

    protected async start() {
        yy.EventCenter.emit(yy.EventName.SHOW_GLOBAL_MASK);
        await playAniSync(this.ani);
        yy.EventCenter.emit(yy.EventName.HIDE_GLOBAL_MASK);
    }

    private isMove = false;
    onTounchEnd() {
        if (this.isMove) return;

        this.isMove = true;
        let pos = this.node.position.x === 0 ? new Vec3(0, 1200, 0) : new Vec3(0, 0, 0);
        tween(this.node)
            .to(1, { position: pos })
            .call(() => {
                this.isMove = false;
            })
            .start();
    }
}


