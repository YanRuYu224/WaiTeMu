import { _decorator, instantiate, Node } from 'cc';
import { yy } from './Pioneer';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager {
    constructor() {

    }

    async ShowUI(path: string, layer: Node = yy.UI) {
        const name = path.substring(path.lastIndexOf("/") + 1);
        for (const node of layer.children) {
            if (node.name === name) {
                node.active = true;
                return node;
            }
        }
        let node = instantiate(await yy.AssetManager.loadPrefab("Art", path));
        node.parent = layer;
        return node;
    }
}


