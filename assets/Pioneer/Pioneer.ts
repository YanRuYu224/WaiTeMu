import { _decorator, Node } from 'cc';
import { AssetManager } from './AssetManager';
import { AudioManager } from './AudioManager';
import { EventCenter } from './EventCenter';
import { EventName } from './EventName';
import { LocalStorageManager } from './LocalStorageManager';
import { StorageName } from './StorageName';
import { UIManager } from './UIManager';
import { VideoManager } from './VideoManager';
const { ccclass, property } = _decorator;

@ccclass('Pioneer')
export class Pioneer {

    private constructor() {
        this.init();
    }

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
    EventCenter: EventCenter;
    EventName: typeof EventName;
    Storage: LocalStorageManager;
    StorageName: typeof StorageName;

    // 游戏层级节点
    Game: Node;
    UI: Node;
    Top: Node;
    Audio: Node;
    Video: Node;

    private init() {
        this.initManager();
    }

    private initManager() {
        this.UIManager = new UIManager();
        this.AudioManager = new AudioManager();
        this.VideoManager = new VideoManager();
        this.AssetManager = new AssetManager();
        this.EventCenter = EventCenter.instance;
        this.EventName = EventName;
        this.Storage = LocalStorageManager.instance;
        this.StorageName = StorageName;
    }

    initLayer(node: Node) {
        this.Game = node.getChildByName(`Game`);
        this.UI = node.getChildByName(`UI`);
        this.Top = node.getChildByName(`Top`);
        this.Audio = node.getChildByName(`Audio`);
        this.Video = node.getChildByName(`Video`);
    }
}

export const yy = Pioneer.instance;
if (!window["yy"]) window["yy"] = yy;


