import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LabelMask')
export class LabelMask extends Component {
    protected onLoad(): void {
        this.typeWriteOver = false;
        this.node.on(Node.EventType.TOUCH_END, this.onClickSelf, this);
    }

    typeWriteOver = false;

    onClickSelf() {
        if (this.typeWriteOver) {
            this.node.active = false;
        }
    }

    setState(boo) {
        this.typeWriteOver = boo;
    }
}


