import { _decorator, Component, Label, Node } from 'cc';
import { Pioneer } from '../Pioneer/Pioneer';
const { ccclass, property } = _decorator;

@ccclass('BeforeDoorDialog')
export class BeforeDoorDialog extends Component {

    @property(Label)
    label: Label = null;

    @property(String)
    label_str: string = ``;

    protected onLoad(): void {
        this.node.on(Node.EventType.TOUCH_END, this.onClick, this);
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

    async onClick() {
        await Pioneer.instance.VideoManager.playLocalVideo({ clip: await Pioneer.instance.AssetManager.loadVideo("Art", "Video/开门动画") });
        this.node.destroy();
    }
}


