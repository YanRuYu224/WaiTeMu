import { _decorator, EventTouch, Label, Node, tween, UITransform, Vec3 } from 'cc';
import { DoorLeft } from './DoorLeft';
import { yy } from '../Pioneer/Pioneer';
import { TypeWrite } from './TypeWrite';
import { QuestionCollection, showQuestionCollection } from './QuestionCollection';
import { showSceneThree } from './SceneThreeFlow';
import { showSceneThreeTelescope } from './SceneThreeTelescopeFlow';
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
    private messenger_item: Node = null;
    private messenger_start_position: Vec3 = new Vec3();
    private messenger_drag_offset: Vec3 = new Vec3();
    private messenger_dragging = false;
    private messenger_drag_enabled = false;
    private messenger_placed = false;
    private messenger_reopen_enabled = false;
    private telescope_item: Node = null;
    private telescope_press_location: Vec3 = new Vec3();
    private telescope_click_pending = false;
    private telescope_click_enabled = false;
    private scene_three_opening = false;
    private notebook: Node = null;
    private collection_finished = false;
    private moving_item_indices: Set<number> = new Set();

    protected onLoad(): void {
        super.onLoad();
        yy.EventCenter.addEventListener(yy.EventName.COLLECTION_ITEM_TO_DESK, this.updateItem, this);
        yy.EventCenter.addEventListener(yy.EventName.NOTEBOOK_READY, this.enableCelestialDrag, this);
        yy.EventCenter.addEventListener(yy.EventName.RETURN_TO_DESK_AFTER_ARISTOTLE, this.returnFromAristotle, this);
    }

    protected onDestroy(): void {
        yy.EventCenter.removeTargetListeners(this);
        this.disableCelestialDrag();
        this.disableMessengerDrag();
        this.disableTelescopeClick();
        if (this.messenger_item) {
            this.messenger_item.off(Node.EventType.TOUCH_END, this.reopenMessenger, this);
        }
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
            .to(0.5, { worldPosition: deskItem.worldPosition })
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
        this.type_write.getComponent(Label).string = '';
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
        const touchPosition = this.getTouchPositionInDesk(event, this.celestial_item);
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

        const touchPosition = this.getTouchPositionInDesk(event, this.celestial_item);
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

    private getTouchPositionInDesk(event: EventTouch, item: Node): Vec3 | null {
        const deskTransform = item?.parent?.getComponent(UITransform);
        if (!deskTransform) return null;

        const location = event.getUILocation();
        return deskTransform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    }

    private returnFromAristotle(): void {
        if (!this.celestial_flow_started || !this.node.isValid) return;

        this.disableCelestialDrag();
        const celestial = this.celestial_item || this.desk_item[1];
        if (celestial && celestial.isValid) celestial.active = false;
        this.type_write.getComponent(Label).string = '';
        this.node.active = true;
        this.enableMessengerDrag();
        yy.EventCenter.removeEventListener(
            yy.EventName.RETURN_TO_DESK_AFTER_ARISTOTLE, this.returnFromAristotle, this,
        );
    }

    private enableMessengerDrag(): void {
        if (this.messenger_drag_enabled || this.messenger_placed) return;

        // desk_item 的下标与物品编号一致，4 对应星界の使者。
        this.messenger_item = this.desk_item[4];
        if (!this.messenger_item || !this.messenger_item.isValid) return;

        this.messenger_start_position.set(this.messenger_item.position);
        this.messenger_item.on(Node.EventType.TOUCH_START, this.onMessengerTouchStart, this);
        this.messenger_item.on(Node.EventType.TOUCH_MOVE, this.onMessengerTouchMove, this);
        this.messenger_item.on(Node.EventType.TOUCH_END, this.onMessengerTouchEnd, this);
        this.messenger_item.on(Node.EventType.TOUCH_CANCEL, this.onMessengerTouchCancel, this);
        this.messenger_drag_enabled = true;
    }

    private disableMessengerDrag(): void {
        if (!this.messenger_item) return;

        this.messenger_item.off(Node.EventType.TOUCH_START, this.onMessengerTouchStart, this);
        this.messenger_item.off(Node.EventType.TOUCH_MOVE, this.onMessengerTouchMove, this);
        this.messenger_item.off(Node.EventType.TOUCH_END, this.onMessengerTouchEnd, this);
        this.messenger_item.off(Node.EventType.TOUCH_CANCEL, this.onMessengerTouchCancel, this);
        this.messenger_drag_enabled = false;
        this.messenger_dragging = false;
    }

    private onMessengerTouchStart(event: EventTouch): void {
        const touchPosition = this.getTouchPositionInDesk(event, this.messenger_item);
        if (!touchPosition) return;

        this.messenger_dragging = true;
        this.messenger_drag_offset.set(
            touchPosition.x - this.messenger_item.position.x,
            touchPosition.y - this.messenger_item.position.y,
            0,
        );
        event.propagationStopped = true;
    }

    private onMessengerTouchMove(event: EventTouch): void {
        if (!this.messenger_dragging) return;

        const touchPosition = this.getTouchPositionInDesk(event, this.messenger_item);
        if (!touchPosition) return;

        this.messenger_item.setPosition(
            touchPosition.x - this.messenger_drag_offset.x,
            touchPosition.y - this.messenger_drag_offset.y,
            this.messenger_item.position.z,
        );
        event.propagationStopped = true;
    }

    private onMessengerTouchEnd(event: EventTouch): void {
        if (!this.messenger_dragging) return;

        this.messenger_dragging = false;
        event.propagationStopped = true;

        const position = this.messenger_item.position;
        const offsetX = position.x - this.celestial_drop_position.x;
        const offsetY = position.y - this.celestial_drop_position.y;
        const isInDropArea = offsetX * offsetX + offsetY * offsetY
            <= this.celestial_drop_radius * this.celestial_drop_radius;

        if (isInDropArea) {
            this.messenger_placed = true;
            this.disableMessengerDrag();
        }

        tween(this.messenger_item)
            .to(0.2, {
                position: (isInDropArea
                    ? this.celestial_drop_position
                    : this.messenger_start_position).clone(),
            })
            .call(() => {
                if (isInDropArea) void this.openSceneThree('galileo');
            })
            .start();
    }

    private onMessengerTouchCancel(event: EventTouch): void {
        if (!this.messenger_dragging) return;

        this.messenger_dragging = false;
        event.propagationStopped = true;
        tween(this.messenger_item)
            .to(0.2, { position: this.messenger_start_position.clone() })
            .start();
    }

    private async openSceneThree(screen: 'galileo' | 'telescope'): Promise<void> {
        if (this.scene_three_opening) return;
        this.scene_three_opening = true;
        try {
            const onExit = () => {
                if (!this.node.isValid) return;
                this.node.active = true;
                this.enableMessengerReopen();
                this.enableTelescopeClick();
            };
            if (screen === 'telescope') await showSceneThreeTelescope(onExit);
            else await showSceneThree(onExit);
            if (this.node.isValid) this.node.active = false;
        } catch (error) {
            console.error('场景3加载失败', error);
            if (this.node.isValid) {
                this.node.active = true;
                if (screen === 'telescope' && this.telescope_item?.isValid) {
                    this.enableTelescopeClick();
                }
            }
        } finally {
            this.scene_three_opening = false;
        }
    }

    private enableMessengerReopen(): void {
        if (this.messenger_reopen_enabled || !this.messenger_item?.isValid) return;
        this.messenger_item.on(Node.EventType.TOUCH_END, this.reopenMessenger, this);
        this.messenger_reopen_enabled = true;
    }

    private reopenMessenger(event: EventTouch): void {
        if (!this.messenger_placed) return;
        event.propagationStopped = true;
        void this.openSceneThree('galileo');
    }

    private enableTelescopeClick(): void {
        if (this.telescope_click_enabled) return;
        // desk_item 的下标与物品编号一致，3 对应望远镜。
        this.telescope_item = this.desk_item[3];
        if (!this.telescope_item?.isValid) return;
        this.telescope_item.on(Node.EventType.TOUCH_START, this.onTelescopeTouchStart, this);
        this.telescope_item.on(Node.EventType.TOUCH_END, this.onTelescopeTouchEnd, this);
        this.telescope_item.on(Node.EventType.TOUCH_CANCEL, this.onTelescopeTouchCancel, this);
        this.telescope_click_enabled = true;
    }

    private disableTelescopeClick(): void {
        if (!this.telescope_item) return;
        this.telescope_item.off(Node.EventType.TOUCH_START, this.onTelescopeTouchStart, this);
        this.telescope_item.off(Node.EventType.TOUCH_END, this.onTelescopeTouchEnd, this);
        this.telescope_item.off(Node.EventType.TOUCH_CANCEL, this.onTelescopeTouchCancel, this);
        this.telescope_click_enabled = false;
        this.telescope_click_pending = false;
    }

    private onTelescopeTouchStart(event: EventTouch): void {
        const location = event.getUILocation();
        this.telescope_press_location.set(location.x, location.y, 0);
        this.telescope_click_pending = true;
        event.propagationStopped = true;
    }

    private onTelescopeTouchEnd(event: EventTouch): void {
        if (!this.telescope_click_pending) return;
        this.telescope_click_pending = false;
        event.propagationStopped = true;
        const location = event.getUILocation();
        const dx = location.x - this.telescope_press_location.x;
        const dy = location.y - this.telescope_press_location.y;
        if (dx * dx + dy * dy > 18 * 18) return;

        this.disableTelescopeClick();
        void this.openSceneThree('telescope');
    }

    private onTelescopeTouchCancel(event: EventTouch): void {
        if (!this.telescope_click_pending) return;
        this.telescope_click_pending = false;
        event.propagationStopped = true;
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

        // 桌面节点仍要接收问答完成事件；收集阶段的事件此时已不再需要。
        yy.EventCenter.removeEventListener(yy.EventName.COLLECTION_ITEM_TO_DESK, this.updateItem, this);
        yy.EventCenter.removeEventListener(yy.EventName.NOTEBOOK_READY, this.enableCelestialDrag, this);
    }

}


