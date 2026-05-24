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

    // 管理器
    UIManager: UIManager;
    AudioManager: AudioManager;
    VideoManager: VideoManager;
    AssetManager: AssetManager;

    // 游戏层级节点
    Game: Node;
    UI: Node;
    Top: Node;

    init() {
        this.initManager();
    }

    initManager() {
        this.UIManager = new UIManager();
        this.AudioManager = new AudioManager();
        this.VideoManager = new VideoManager();
        this.AssetManager = new AssetManager();
    }

    initLayer(node: Node) {
        this.Game = node.getChildByName(`Game`);
        this.UI = node.getChildByName(`UI`);
        this.Top = node.getChildByName(`Top`);
    }
}


