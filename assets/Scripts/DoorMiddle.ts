import { _decorator, Node, tween } from 'cc';
import { DoorLeft } from './DoorLeft';
import { yy } from '../Pioneer/Pioneer';
import { TypeWrite } from './TypeWrite';
const { ccclass, property } = _decorator;

@ccclass('DoorMiddle')
export class DoorMiddle extends DoorLeft {

    @property(Node)
    desk_item: Node[] = [];

    @property(TypeWrite)
    type_write: TypeWrite = null;

    protected onLoad(): void {
        super.onLoad();
        yy.EventCenter.on(yy.EventName.COLLECTION_ITEM_TO_DESK, this.updateItem, this);
    }

    protected onEnable(): void {
        yy.EventCenter.emit(yy.EventName.SET_BAG_ITEM_MOVE_STATE, true);
    }

    protected onDisable(): void {
        yy.EventCenter.emit(yy.EventName.SET_BAG_ITEM_MOVE_STATE, false);
    }

    updateItem(index, node: Node) {
        tween(node)
            .to(1, { worldPosition: this.desk_item[index].worldPosition })
            .call(() => {
                this.desk_item[index].children[0].active = false;
                node.parent.active = false;
                this.checkCollectFinish();
            })
            .start();

    }

    async checkCollectFinish() {
        let finish = this.desk_item.every((node) => !node.children[0].active);
        if (finish) {
            this.type_write.textContent = 'これで大丈夫でしょう';
            await this.type_write.start();
            yy.EventCenter.emit(yy.EventName.DESTROY_BAG);
            yy.UIManager.ShowUI("Prefabs/NoteBook", yy.Top);
        }
    }

}


