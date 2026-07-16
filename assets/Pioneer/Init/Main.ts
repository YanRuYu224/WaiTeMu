import { _decorator, Component } from 'cc';
import { yy } from '../Pioneer';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    protected onLoad(): void {
        yy.initLayer(this.node);
    }

    protected async start(): Promise<void> {
        let clips = [await yy.AssetManager.loadVideo("Art", "Video/开场动画"), await yy.AssetManager.loadVideo("Art", "Video/入场动画"), await yy.AssetManager.loadVideo("Art", "Video/人物背景说明")];
        for (let i = 0; i < clips.length; ++i) {
            await yy.VideoManager.playLocalVideo({ clip: clips[i] });
        }
        yy.UIManager.ShowUI("Prefabs/BeforeDoorDialog");
    }
}


