import { _decorator, Component, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('GlobalMask')
export class GlobalMask extends Component {
    protected onLoad(): void {
        this.node.active = false;

        yy.EventCenter.on(yy.EventName.SHOW_GLOBAL_MASK, this.show, this);
        yy.EventCenter.on(yy.EventName.HIDE_GLOBAL_MASK, this.hide, this);
    }

    protected onDestroy(): void {
        yy.EventCenter.off(yy.EventName.SHOW_GLOBAL_MASK, this.show);
        yy.EventCenter.off(yy.EventName.HIDE_GLOBAL_MASK, this.hide);
    }

    show() {
        this.node.active = true;
    }

    hide() {
        this.node.active = false;
    }
}


