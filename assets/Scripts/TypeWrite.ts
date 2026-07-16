import { _decorator, Component, EventHandler, Label, tween, Tween } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TypeWrite')
export class TypeWrite extends Component {

    @property({ type: String, displayName: "文本内容" })
    textContent: string = "";

    @property({ type: Number, displayName: "打字速度(s/字)" })
    speed: number = 0.05;

    @property({ type: Boolean, displayName: "播完销毁", visible() { return !this.hideAfterPlay } })
    destroyAfterPlay: boolean = false;

    @property({ type: Number, displayName: "延迟销毁(s)", visible() { return this.destroyAfterPlay } })
    destroyDelay: number = 0;

    @property({ type: Boolean, displayName: "播完隐藏", visible() { return !this.destroyAfterPlay } })
    hideAfterPlay: boolean = false;

    @property({ type: Number, displayName: "延迟隐藏(s)", visible() { return this.hideAfterPlay } })
    hideDelay: number = 0;

    @property({ type: Boolean, displayName: "播完回调" })
    eventsAfterPlay: boolean = false;

    @property({ type: [EventHandler], displayName: "回调函数", visible() { return this.eventsAfterPlay } })
    completeEvents: EventHandler[] = [];

    private _label: Label = null;
    private _text: string = "";
    private _progress = { value: 0 };
    private _tween: Tween<any> = null;
    private _resolve: (() => void) = null;

    async start() {
        this._label = this.getComponent(Label);
        if (!this._label) {
            console.error(`${this.node.name} 缺少Label组件`);
            return;
        }

        this._text = this.textContent || this._label.string;
        await this.play();
    }

    public play(): Promise<void> {
        this.stop();

        this._label.string = "";
        this._progress.value = 0;

        return new Promise(resolve => {
            this._resolve = resolve;

            this._tween = tween(this._progress)
                .to(this._text.length * this.speed, { value: this._text.length }, {
                    onUpdate: () => {
                        this._label.string = this._text.substring(0, Math.floor(this._progress.value));
                    }
                })
                .call(() => {
                    this._label.string = this._text;
                    this._onComplete();
                    this._resolve?.();
                    this._resolve = null;
                })
                .start();
        });
    }

    public skip() {
        if (!this._tween) {
            return;
        }

        this._tween.stop();
        this._tween = null;

        this._label.string = this._text;
        this._onComplete();

        this._resolve?.();
        this._resolve = null;
    }

    public stop() {
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }

    private _onComplete() {
        if (this.destroyAfterPlay) {
            this.scheduleOnce(() => {
                this.node.destroy();
            }, this.destroyDelay);
        } else if (this.hideAfterPlay) {
            this.scheduleOnce(() => {
                this.node.active = false;
            }, this.hideDelay);
        }

        if (this.eventsAfterPlay) {
            EventHandler.emitEvents(this.completeEvents, true);
        }
    }

    protected onDestroy() {
        this.stop();
        this._resolve = null;
    }
}