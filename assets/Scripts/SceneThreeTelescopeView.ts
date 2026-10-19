import {
    _decorator, Component, EventTouch, Mask, Node, UITransform, Vec3,
} from 'cc';

const { ccclass } = _decorator;
export type SceneThreeObservation = 'moon' | 'jupiter';

export interface SceneThreeTelescopeActions {
    close(): void;
    observationShown(clue: SceneThreeObservation): void;
    observationCollected(clue: SceneThreeObservation): void;
}

export interface SceneThreeTelescopeData {
    observedMoon: boolean;
    observedJupiter: boolean;
    viewingClue: SceneThreeObservation | null;
}

const OBSERVATION_POSITIONS: Record<SceneThreeObservation, Vec3> = {
    moon: new Vec3(-30, 285, 0),
    jupiter: new Vec3(400, -95, 0),
};
// 木星描边图中的黄色圆心偏离贴图中心，单独补偿绘制位置，不影响观测命中坐标。
const JUPITER_OUTLINE_VISUAL_OFFSET = new Vec3(40, -28, 0);

/** Refreshes the authored telescope prefab and forwards its user actions. */
@ccclass('SceneThreeTelescopeView')
export class SceneThreeTelescopeView extends Component {
    private data: SceneThreeTelescopeData = null;
    private actions: SceneThreeTelescopeActions = null;
    private lens: Node = null;
    private aperture: Node = null;
    private starMap: Node = null;
    private moonOutline: Node = null;
    private jupiterOutline: Node = null;
    private lensOffset = new Vec3();
    private lensStart = new Vec3();
    private lensMoving = false;
    private initializedLens = false;

    protected onLoad(): void {
        this.lens = this.requireNode('Lens');
        this.aperture = this.requireNode('Lens/Aperture');
        this.starMap = this.requireNode('Lens/Aperture/StarMap');
        this.moonOutline = this.requireNode('Lens/Aperture/MoonOutline');
        this.jupiterOutline = this.requireNode('Lens/Aperture/JupiterOutline');
        const mask = this.aperture.getComponent(Mask);
        if (!mask) throw new Error('SceneThreeTelescope.prefab 的镜头 Aperture 缺少 Mask');
        mask.type = Mask.Type.GRAPHICS_ELLIPSE;

        this.lens.on(Node.EventType.TOUCH_START, this.onLensStart, this);
        this.lens.on(Node.EventType.TOUCH_MOVE, this.onLensMove, this);
        this.lens.on(Node.EventType.TOUCH_END, this.onLensEnd, this);
        this.lens.on(Node.EventType.TOUCH_CANCEL, this.onLensCancel, this);
        this.touch('Back', () => this.actions.close());
        this.touch('MoonCard', () => this.actions.observationCollected('moon'));
        this.touch('JupiterCard', () => this.actions.observationCollected('jupiter'));
    }

    public refresh(data: SceneThreeTelescopeData, actions: SceneThreeTelescopeActions): void {
        this.data = data;
        this.actions = actions;
        if (!this.initializedLens) {
            this.lens.setPosition(-240, 0, 0);
            this.initializedLens = true;
        }
        this.requireNode('MoonThumbnail').active = data.observedMoon;
        this.requireNode('JupiterThumbnail').active = data.observedJupiter;
        this.moonOutline.active = !data.observedMoon && this.nearTarget('moon');
        this.jupiterOutline.active = !data.observedJupiter && this.nearTarget('jupiter');
        this.requireNode('MoonCard').active = data.viewingClue === 'moon';
        this.requireNode('JupiterCard').active = data.viewingClue === 'jupiter';
        this.updateLensContents();
    }

    private onLensStart(event: EventTouch): void {
        if (this.data?.viewingClue) return;
        const point = this.touchPosition(event);
        this.lensStart.set(this.lens.position);
        this.lensOffset.set(point.x - this.lens.position.x, point.y - this.lens.position.y, 0);
        this.lensMoving = false;
        event.propagationStopped = true;
    }

    private onLensMove(event: EventTouch): void {
        if (this.data?.viewingClue || !this.lens?.isValid) return;
        const point = this.touchPosition(event);
        const x = Math.max(-710, Math.min(710, point.x - this.lensOffset.x));
        const y = Math.max(-360, Math.min(360, point.y - this.lensOffset.y));
        this.lensMoving ||= Vec3.distance(this.lensStart, new Vec3(x, y, 0)) > 12;
        this.lens.setPosition(x, y, 0);
        this.updateLensContents();
        event.propagationStopped = true;
    }

    private onLensEnd(event: EventTouch): void {
        if (!this.lens?.isValid || this.data?.viewingClue) return;
        event.propagationStopped = true;
        if (this.lensMoving) return;
        if (!this.data.observedMoon && this.nearTarget('moon')) this.actions.observationShown('moon');
        else if (!this.data.observedJupiter && this.nearTarget('jupiter')) this.actions.observationShown('jupiter');
    }

    private onLensCancel(event: EventTouch): void {
        this.lensMoving = false;
        event.propagationStopped = true;
    }

    private updateLensContents(): void {
        if (!this.lens?.isValid || !this.data) return;
        const position = this.lens.position;
        this.starMap.setPosition(-position.x, -position.y, 0);
        this.moonOutline.setPosition(
            OBSERVATION_POSITIONS.moon.x - position.x,
            OBSERVATION_POSITIONS.moon.y - position.y, 0,
        );
        this.jupiterOutline.setPosition(
            OBSERVATION_POSITIONS.jupiter.x - position.x + JUPITER_OUTLINE_VISUAL_OFFSET.x,
            OBSERVATION_POSITIONS.jupiter.y - position.y + JUPITER_OUTLINE_VISUAL_OFFSET.y,
            0,
        );
        this.moonOutline.active = !this.data.observedMoon && this.nearTarget('moon');
        this.jupiterOutline.active = !this.data.observedJupiter && this.nearTarget('jupiter');
    }

    private nearTarget(clue: SceneThreeObservation): boolean {
        return Vec3.distance(this.lens.position, OBSERVATION_POSITIONS[clue]) < 120;
    }

    private requireNode(path: string): Node {
        let node: Node = this.node;
        for (const segment of path.split('/')) node = node?.getChildByName(segment);
        if (!node) throw new Error(`SceneThreeTelescope.prefab 缺少显示节点：${path}`);
        return node;
    }

    private touch(path: string, action: () => void): void {
        this.requireNode(path).on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            action();
        }, this);
    }

    private touchPosition(event: EventTouch): Vec3 {
        const point = event.getUILocation();
        return this.node.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(point.x, point.y, 0));
    }
}
