import { _decorator, Component, instantiate, Node } from 'cc';
import { Pioneer } from '../Pioneer';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    protected onLoad(): void {
        Pioneer.instance.initLayer(this.node);
    }

    protected async start(): Promise<void> {
        await Pioneer.instance.VideoManager.playLocalVideo({ clip: await Pioneer.instance.AssetManager.loadVideo("Art", "Video/开场动画") });
        await Pioneer.instance.VideoManager.playLocalVideo({ clip: await Pioneer.instance.AssetManager.loadVideo("Art", "Video/入场动画") });
        await Pioneer.instance.VideoManager.playLocalVideo({ clip: await Pioneer.instance.AssetManager.loadVideo("Art", "Video/人物背景说明") });
        Pioneer.instance.UIManager.ShowUI("Prefabs/BeforeDoorDialog");
    }
}


