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
    btn_left: Node = null;

    @property(Node)
    btn_right: Node = null;

    @property(Node)
    btn_middle: Node = null;

    bag;

    protected onLoad(): void {
        this.stage_one.on(Node.EventType.MOUSE_UP, this.onClick, this);

        this.btn_left.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.btn_left), this);
        this.btn_left.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.btn_left), this);
        this.btn_left.on(Node.EventType.MOUSE_UP, this.onClickLeft, this);

        this.btn_middle.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.btn_middle), this);
        this.btn_middle.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.btn_middle), this);
        this.btn_middle.on(Node.EventType.MOUSE_UP, this.onClickMiddle, this);

        this.btn_right.on(Node.EventType.MOUSE_ENTER, this.onEnterDoor.bind(this, this.btn_right), this);
        this.btn_right.on(Node.EventType.MOUSE_LEAVE, this.onLeaveDoor.bind(this, this.btn_right), this);
        this.btn_right.on(Node.EventType.MOUSE_UP, this.onClickRight, this);

        this.stage_one.active = true;
        this.typeWrite(this.label, this.label_str);
        Pioneer.instance.UIManager.ShowUI("Prefabs/Bag", Pioneer.instance.Top).then((node) => {
            this.bag = node;
            this.bag.active = false;
        });

        Pioneer.instance.EventCenter.on(Pioneer.instance.EventName.SET_BAG_STATE, this.setState, this);
    }

    setState(state) {
        this.bag.active = state;
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

    onEnterDoor(node: Node) {
        node.children[0].active = true;
    }

    onLeaveDoor(node: Node) {
        node.children[0].active = false;
    }

    onClickRight() {
        this.bag.active = true;
        Pioneer.instance.UIManager.ShowUI("Prefabs/DoorRight");
    }

    onClickLeft() {
        this.bag.active = true;
        Pioneer.instance.UIManager.ShowUI("Prefabs/DoorLeft");
    }

    onClickMiddle() {
        this.bag.active = true;
        Pioneer.instance.UIManager.ShowUI("Prefabs/DoorMiddle");
    }
}


