import { _decorator, Component, Label, Node } from 'cc';
import { Pioneer } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('BeforeDoorDialog')
export class BeforeDoorDialog extends Component {

    @property(Label)
    label: Label = null;

    @property(String)
    label_str: string = ``;

    @property(Node)
    stage_one: Node = null;

    @property(Node)
    stage_two: Node = null;

    @property(Node)
    left_node: Node = null;

    @property(Node)
    right_node: Node = null;

    @property(Node)
    left_back: Node = null;

    @property(Node)
    right_back: Node = null;

    @property(Node)
    btn_left: Node = null;

    @property(Node)
    btn_right: Node = null;

    protected onLoad(): void {
        this.stage_one.on(Node.EventType.TOUCH_END, this.onClick, this);
        this.btn_left.on(Node.EventType.TOUCH_END, this.onClickLeft, this);
        this.btn_right.on(Node.EventType.TOUCH_END, this.onClickRight, this);
        this.left_back.on(Node.EventType.TOUCH_END, this.onClickLeftBack, this);
        this.right_back.on(Node.EventType.TOUCH_END, this.onClickRightBack, this);

        this.typeWrite(this.label, this.label_str);
    }

    typeWrite(label: Label, content: string, interval: number = 0.05) {

        // 清空文本
        label.string = '';

        let index = 0;

        // 防止重复调用
        this.unscheduleAllCallbacks();

        this.schedule(() => {

            // 结束
            if (index >= content.length) {

                this.unscheduleAllCallbacks();

                return;
            }

            // 逐字添加
            label.string += content[index];

            index++;

        }, interval);
    }

    resetLabel() {
        this.label.string = ``;
    }

    async onClick() {
        await Pioneer.instance.VideoManager.playLocalVideo({ clip: await Pioneer.instance.AssetManager.loadVideo("Art", "Video/开门动画") });
        this.stage_one.destroy();
        this.resetLabel();
    }

    onClickLeft() {
        this.stage_two.active = false;
        this.left_node.active = true;
    }

    onClickRight() {
        this.stage_two.active = false;
        this.right_node.active = true;
    }

    onClickLeftBack() {
        this.stage_two.active = true;
        this.left_node.active = false;
    }

    onClickRightBack() {
        this.stage_two.active = true;
        this.right_node.active = false;
    }
}


