import { _decorator, Component, Node } from 'cc';
import { yy } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('GlobalMask')
export class GlobalMask extends Component {
    protected onLoad(): void {
        this.node.active = false;

        yy.EventCenter.addEventListener(yy.EventName.SHOW_GLOBAL_MASK, this.show, this);
        yy.EventCenter.addEventListener(yy.EventName.HIDE_GLOBAL_MASK, this.hide, this);
    }

    protected onDestroy(): void {
        yy.EventCenter.removeTargetListeners(this);
    }

    show() {
        this.node.active = true;
    }

    hide() {
        this.node.active = false;
    }
}


