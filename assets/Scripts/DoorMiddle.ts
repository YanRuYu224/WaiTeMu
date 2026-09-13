import { _decorator, EventTouch, Label, Node, tween, UITransform, Vec3 } from 'cc';
import { DoorLeft } from './DoorLeft';
import { yy } from '../Pioneer/Pioneer';
import { TypeWrite } from './TypeWrite';
import { QuestionCollection, showQuestionCollection } from './QuestionCollection';
const { ccclass, property } = _decorator;

@ccclass('DoorMiddle')
export class DoorMiddle extends DoorLeft {

    @property(Node)
    desk_item: Node[] = [];

    @property(TypeWrite)
    type_write: TypeWrite = null;

    @property({ displayName: "天体论落点（桌面本地坐标）" })
    celestial_drop_position: Vec3 = new Vec3(100, -350, 0);

    @property({ displayName: "天体论落点吸附半径" })
    celestial_drop_radius: number = 300;

    private celestial_item: Node = null;
    private celestial_start_position: Vec3 = new Vec3();
    private celestial_drag_offset: Vec3 = new Vec3();
    private celestial_dragging = false;
    private celestial_drag_enabled = false;
    private celestial_flow_started = false;
    private notebook: Node = null;
    private collection_finished = false;
    private moving_item_indices: Set<number> = new Set();

    protected onLoad(): void {
        super.onLoad();
        yy.EventCenter.addEventListener(yy.EventName.COLLECTION_ITEM_TO_DESK, this.updateItem, this);
        yy.EventCenter.addEventListener(yy.EventName.NOTEBOOK_READY, this.enableCelestialDrag, this);
    }

    protected onDestroy(): void {
        yy.EventCenter.removeTargetListeners(this);
        this.disableCelestialDrag();
    }

    protected onEnable(): void {
        yy.EventCenter.dispatchEvent(yy.EventName.SET_BAG_ITEM_MOVE_STATE, true);
    }

    protected onDisable(): void {
        yy.EventCenter.dispatchEvent(yy.EventName.SET_BAG_ITEM_MOVE_STATE, false);
    }

    updateItem(index, node: Node) {
        const deskItem = this.desk_item[index];
        if (
            this.collection_finished
            || !deskItem
            || !deskItem.children[0]?.active
            || this.moving_item_indices.has(index)
        ) return;

        this.moving_item_indices.add(index);
        tween(node)
            .to(1, { worldPosition: deskItem.worldPosition })
            .call(() => {
                deskItem.children[0].active = false;
                node.parent.active = false;
                this.moving_item_indices.delete(index);
                void this.checkCollectFinish();
            })
            .start();

    }

    async checkCollectFinish() {
        if (this.collection_finished) return;

        const finish = this.desk_item.every((node) => !node.children[0].active);
        if (!finish) return;

        // 在任何 await 之前锁定完成状态，避免同一流程并发执行。
        this.collection_finished = true;
        this.type_write.textContent = 'これで大丈夫でしょう';
        await this.type_write.start();
        yy.EventCenter.dispatchEvent(yy.EventName.DESTROY_BAG);
        this.notebook = await yy.UIManager.ShowUI("Prefabs/NoteBook", yy.Top);
    }

    private enableCelestialDrag() {
        if (this.celestial_drag_enabled) return;

        // desk_item 的下标与物品编号一致，1 对应天体论。
        this.celestial_item = this.desk_item[1];
        if (!this.celestial_item) return;

        this.celestial_start_position.set(this.celestial_item.position);
        this.celestial_item.on(Node.EventType.TOUCH_START, this.onCelestialTouchStart, this);
        this.celestial_item.on(Node.EventType.TOUCH_MOVE, this.onCelestialTouchMove, this);
        this.celestial_item.on(Node.EventType.TOUCH_END, this.onCelestialTouchEnd, this);
        this.celestial_item.on(Node.EventType.TOUCH_CANCEL, this.onCelestialTouchCancel, this);
        this.celestial_drag_enabled = true;
    }

    private disableCelestialDrag() {
        if (!this.celestial_item) return;

        this.celestial_item.off(Node.EventType.TOUCH_START, this.onCelestialTouchStart, this);
        this.celestial_item.off(Node.EventType.TOUCH_MOVE, this.onCelestialTouchMove, this);
        this.celestial_item.off(Node.EventType.TOUCH_END, this.onCelestialTouchEnd, this);
        this.celestial_item.off(Node.EventType.TOUCH_CANCEL, this.onCelestialTouchCancel, this);
        this.celestial_drag_enabled = false;
        this.celestial_dragging = false;
    }

    private onCelestialTouchStart(event: EventTouch) {
        const touchPosition = this.getTouchPositionInDesk(event);
        if (!touchPosition) return;

        this.celestial_dragging = true;
        this.celestial_drag_offset.set(
            touchPosition.x - this.celestial_item.position.x,
            touchPosition.y - this.celestial_item.position.y,
            0
        );
        event.propagationStopped = true;
    }

    private onCelestialTouchMove(event: EventTouch) {
        if (!this.celestial_dragging) return;

        const touchPosition = this.getTouchPositionInDesk(event);
        if (!touchPosition) return;

        this.celestial_item.setPosition(
            touchPosition.x - this.celestial_drag_offset.x,
            touchPosition.y - this.celestial_drag_offset.y,
            this.celestial_item.position.z
        );
        event.propagationStopped = true;
    }

    private onCelestialTouchEnd(event: EventTouch) {
        if (!this.celestial_dragging) return;

        this.celestial_dragging = false;
        event.propagationStopped = true;

        const position = this.celestial_item.position;
        const offsetX = position.x - this.celestial_drop_position.x;
        const offsetY = position.y - this.celestial_drop_position.y;
        const isInDropArea = offsetX * offsetX + offsetY * offsetY
            <= this.celestial_drop_radius * this.celestial_drop_radius;

        const targetPosition = isInDropArea
            ? this.celestial_drop_position
            : this.celestial_start_position;

        tween(this.celestial_item)
            .to(0.2, { position: targetPosition.clone() })
            .call(() => {
                if (isInDropArea) {
                    this.disableCelestialDrag();
                    void this.startQuestionCollectionFlow();
                }
            })
            .start();
    }

    private onCelestialTouchCancel(event: EventTouch) {
        if (!this.celestial_dragging) return;

        this.celestial_dragging = false;
        event.propagationStopped = true;
        tween(this.celestial_item)
            .to(0.2, { position: this.celestial_start_position.clone() })
            .start();
    }

    private getTouchPositionInDesk(event: EventTouch): Vec3 | null {
        const deskTransform = this.celestial_item?.parent?.getComponent(UITransform);
        if (!deskTransform) return null;

        const location = event.getUILocation();
        return deskTransform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    }

    private async startQuestionCollectionFlow() {
        if (this.celestial_flow_started) return;
        this.celestial_flow_started = true;

        const questionCollection = showQuestionCollection(false);

        const guideTransform = this.type_write.getComponent(UITransform);
        const guideLabel = this.type_write.getComponent(Label);
        guideTransform?.setContentSize(1200, 100);
        if (guideLabel) {
            guideLabel.fontSize = 32;
            guideLabel.lineHeight = 40;
            guideLabel.overflow = Label.Overflow.SHRINK;
        }
        this.type_write.textContent = '先生はよく、ご自身が若い頃、この本はほぼすべての学者に\nとって宇宙を学ぶ出発点だったとおっしゃいます';
        await this.type_write.start();

        if (this.notebook && this.notebook.isValid) {
            this.notebook.destroy();
            this.notebook = null;
        }
        this.node.active = false;

        const questionCollectionNode = await questionCollection;
        const questionCollectionView = questionCollectionNode.getComponent(QuestionCollection);
        if (!questionCollectionView) {
            throw new Error('QuestionCollection.prefab 缺少 QuestionCollection 脚本');
        }
        await questionCollectionView.playEntrance();

        // 桌面节点此前已被停用。不要在视频完成回调尚未退栈时销毁它，
        // 只解绑全局事件，节点随场景正常释放即可。
        yy.EventCenter.removeTargetListeners(this);
    }

}


