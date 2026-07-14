import { instantiate } from 'cc';
import { _decorator, Component, Node } from 'cc';
import { Pioneer } from './Pioneer';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager {
    constructor() {

    }

    async ShowUI(path: string, layer: Node = Pioneer.instance.UI) {
        let node = instantiate(await Pioneer.instance.AssetManager.loadPrefab("Art", path));
        node.parent = layer;
        return node;
    }
}


