import { _decorator, Component, EventTouch, Node } from 'cc';
import { Item, ItemType } from './Item';
const { ccclass, property } = _decorator;

@ccclass('SceneThreeGravityResult')
export class SceneThreeGravityResult extends Component {
    @property(Node)
    result: Node = null;

    protected onLoad(): void {
        this.result.on(Node.EventType.TOUCH_START, this.onClick, this);
    }

    protected onDestroy(): void {
        this.result.off(Node.EventType.TOUCH_START, this.onClick, this);
    }

    onClick(event: EventTouch): void {
        event.propagationStopped = true;
        if (!this.node.active) return;
        Item.giveToBag(ItemType.Gravity);
        this.node.active = false;
    }
}


