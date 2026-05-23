import { _decorator, Component, Node } from 'cc';
import { UIManager } from './UIManager';
import { AudioManager } from './AudioManager';
import { VideoManager } from './VideoManager';
import { AssetManager } from './AssetManager';
const { ccclass, property } = _decorator;

@ccclass('Pioneer')
export class Pioneer {

    private static _instance: Pioneer;

    public static get instance(): Pioneer {
        if (!this._instance) {
            this._instance = new Pioneer();
        }
        return this._instance;
    }

    UIManager: UIManager;
    AudioManager: AudioManager;
    VideoManager: VideoManager;
    AssetManager: AssetManager;

    init() {
        console.log(`先行者被创建`);
        this.UIManager = new UIManager();
        this.AudioManager = new AudioManager();
        this.VideoManager = new VideoManager();
        this.AssetManager = new AssetManager();
    }
}


