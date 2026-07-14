import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TypeWrite')
export class TypeWrite extends Component {

    @property
    speed: number = 0.05; // 每个字间隔时间

    private label: Label = null;

    private text: string = "";
    private index: number = 0;
    private timer: number = 0;
    private isPlaying: boolean = false;


    start() {
        this.label = this.node.getComponent(Label);

        if (!this.label) {
            console.error("TypeWrite节点没有Label组件");
            return;
        }

        // 保存原始文字
        this.text = this.label.string;

        // 清空
        this.label.string = "";

        // 开始播放
        this.play();
    }


    play() {
        this.index = 0;
        this.timer = 0;
        this.isPlaying = true;
        this.label.string = "";
    }


    update(dt: number) {
        if (!this.isPlaying) {
            return;
        }

        this.timer += dt;

        if (this.timer >= this.speed) {
            this.timer = 0;
            this.index++;
            this.label.string = this.text.substring(
                0,
                this.index
            );

            if (this.index >= this.text.length) {
                this.isPlaying = false;
            }
        }
    }


    // 点击跳过
    skip() {
        this.label.string = this.text;
        this.isPlaying = false;
    }
}