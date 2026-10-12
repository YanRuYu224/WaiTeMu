import {
    _decorator, Color, Component, EventTouch, Label, Mask, Node, Sprite, SpriteFrame,
    UITransform, Vec3, view,
} from 'cc';
import { yy } from '../Pioneer/Pioneer';

const { ccclass } = _decorator;
type Screen = 'galileo' | 'telescope' | 'gravity' | 'choice' | 'ending';
type Clue = 'moon' | 'jupiter' | 'gravity';

const IMAGE_ROOT = 'Images/Scene3/';
const IMAGE_PATHS = [
    '统一背景',
    '问答页/点击人物',
    '问答页/木星回答（对话）',
    '问答页/木星介绍（线索）',
    '问答页/未收集线索',
    '问答页/星界使者',
    '问答页/星界の使者(本体)',
    '问答页/月球回答（对话）',
    '问答页/月球介绍(线索)',
    '问答页/重力回答（对话）',
    '问答页/重力介绍（线索）',
    '问答页/人物拆分/出自己观点',
    '问答页/人物拆分/人物名',
    '问答页/人物拆分/未提问状态',
    '问答页/人物拆分/未找到线索',
    '问答页/收集回答/地球は宇宙の中心ではない',
    '问答页/收集回答/天体は完壁な球体ではない',
    '问答页/收集回答/重い物ほど速く落ちるわけではない',
    '望远镜观测/镜头',
    '望远镜观测/镜头下2',
    '望远镜观测/星空图',
    '望远镜观测/线索/月球/月球简介悬浮框',
    '望远镜观测/线索/月球/月球描边',
    '望远镜观测/线索/月球/月球背包缩略图',
    '望远镜观测/线索/木星/木星悬浮框',
    '望远镜观测/线索/木星/木星描边',
    '望远镜观测/线索/木星/木星线索缩略图',
    '重力实验/背景',
    '重力实验/两只手',
    '重力实验/10kg',
    '重力实验/1kg',
    '重力实验/-下へ投げる-',
    '是否认罪选择页/文字',
    '是否认罪选择页/认罪',
    '是否认罪选择页/不认罪',
    '认错结局/火焰2',
    '认错结局/星界の使者',
    '结局/被烧死结局/異端火',
    '结局/被烧死结局/引言',
];

const OBSERVATION_POSITIONS: Record<'moon' | 'jupiter', Vec3> = {
    moon: new Vec3(-30, 285, 0),
    jupiter: new Vec3(400, -95, 0),
};

@ccclass('SceneThreeFlow')
export class SceneThreeFlow extends Component {
    private frames = new Map<string, SpriteFrame>();
    private loading: Promise<void> = null;
    private content: Node = null;
    private currentScreen: Screen = 'galileo';
    private onExit: (() => void) = null;
    private observedMoon = false;
    private observedJupiter = false;
    private gravityDone = false;
    private collected: Record<Clue, boolean> = { moon: false, jupiter: false, gravity: false };
    private galileoIntroduced = false;
    private selectedClue: Clue = null;
    private viewingClue: 'moon' | 'jupiter' = null;
    private ending: 'confess' | 'refuse' = null;
    private endingPlaying = false;
    private lens: Node = null;
    private starMap: Node = null;
    private moonOutline: Node = null;
    private jupiterOutline: Node = null;
    private lensOffset = new Vec3();
    private lensStart = new Vec3();
    private lensMoving = false;

    protected onLoad(): void {
        this.content = new Node('SceneThreeContent');
        this.content.layer = this.node.layer;
        this.content.parent = this.node;
        this.content.addComponent(UITransform).setContentSize(1920, 1080);
        view.on('canvas-resize', this.adaptToScreen, this);
        view.on('design-resolution-changed', this.adaptToScreen, this);
        this.adaptToScreen();
    }

    protected onDestroy(): void {
        view.off('canvas-resize', this.adaptToScreen, this);
        view.off('design-resolution-changed', this.adaptToScreen, this);
    }

    public async open(screen: 'galileo' | 'telescope', onExit: () => void): Promise<void> {
        this.onExit = onExit;
        if (!this.loading) this.loading = this.preload();
        await this.loading;
        if (!this.node.isValid) return;
        this.node.active = true;
        this.render(screen);
    }

    private async preload(): Promise<void> {
        await yy.AssetManager.loadBundle('Art');
        await Promise.all(IMAGE_PATHS.map(async path => {
            const frame = await yy.AssetManager.loadSpriteFrame('Art', IMAGE_ROOT + path + '/spriteFrame');
            this.frames.set(path, frame);
        }));
        const back = await yy.AssetManager.loadSpriteFrame('Art', 'Images/书房/返回键/spriteFrame');
        this.frames.set('back', back);
    }

    private render(screen: Screen): void {
        this.currentScreen = screen;
        for (const child of [...this.content.children]) {
            child.active = false;
            child.destroy();
        }
        this.lens = null;
        this.viewingClue = null;
        if (screen === 'galileo') this.renderGalileo();
        else if (screen === 'telescope') this.renderTelescope();
        else if (screen === 'gravity') this.renderGravity();
        else if (screen === 'choice') this.renderChoice();
        else this.renderEnding();
    }

    private renderGalileo(): void {
        this.image('统一背景', 1920, 1341, 0, 0);
        this.image('问答页/星界使者', 730, 148, 0, 448);
        this.image('问答页/人物拆分/人物名', 300, 26, -270, 334);
        this.back(() => this.close());

        const characterArt = this.selectedClue
            ? '问答页/人物拆分/出自己观点'
            : '问答页/人物拆分/未提问状态';
        const character = this.image(characterArt, 490, 550, -285, -120);
        character.name = 'Character';
        this.touch(character, () => {
            if (this.selectedClue) {
                this.collectAnswer(this.selectedClue);
            } else if (!this.galileoIntroduced) {
                this.galileoIntroduced = true;
                this.render('galileo');
            } else {
                this.close();
            }
        });

        if (!this.galileoIntroduced) {
            this.image('问答页/点击人物', 400, 170, 140, 180);
            return;
        }

        const book = this.image('问答页/星界の使者(本体)', 188, 256, -750, -215);
        if (this.allCollected()) this.touch(book, () => this.render('choice'));

        const clues: Clue[] = ['moon', 'jupiter', 'gravity'];
        const titles = ['月の表面', '木星の周囲', '重さと落下'];
        clues.forEach((clue, index) => {
            const y = 320 - index * 235;
            const panel = this.image(
                this.collected[clue] ? this.answerArt(clue) : '问答页/未收集线索',
                140, 198, 585, y,
            );
            if (!this.collected[clue]) {
                this.label(titles[index], 24, 116, 42, 585, y - 58, panel);
                this.touch(panel, () => this.ask(clue));
            }
        });
        const unanswered = this.image('问答页/未收集线索', 140, 198, 585, -385);
        this.label('地球の動き', 24, 116, 42, 585, -443, unanswered);
        this.touch(unanswered, () => this.showNoAnswer());

        if (this.selectedClue) {
            const bubble = this.image(this.dialogueArt(this.selectedClue), 470, 200, 150, 195);
            this.touch(bubble, () => this.collectAnswer(this.selectedClue));
            this.label('回答を記録する', 25, 240, 35, 150, 75);
        } else if (this.allCollected()) {
            this.label('星界の使者を開く', 28, 340, 44, -685, -395);
        }
    }

    private ask(clue: Clue): void {
        if (clue === 'gravity' && !this.gravityDone) {
            this.render('gravity');
            return;
        }
        if ((clue === 'moon' && !this.observedMoon)
            || (clue === 'jupiter' && !this.observedJupiter)) {
            this.selectedClue = null;
            this.render('galileo');
            const old = this.content.getChildByName('Character');
            if (old) old.active = false;
            const character = this.image('问答页/人物拆分/未找到线索', 490, 550, -285, -120);
            character.name = 'Character';
            this.touch(character, () => this.close());
            return;
        }
        this.selectedClue = clue;
        this.render('galileo');
    }

    private showNoAnswer(): void {
        this.selectedClue = null;
        this.render('galileo');
        const old = this.content.getChildByName('Character');
        if (old) old.active = false;
        const character = this.image('问答页/人物拆分/未找到线索', 490, 550, -285, -120);
        character.name = 'Character';
        this.label('無回答', 31, 200, 55, 30, 160);
        this.touch(character, () => this.render('galileo'));
    }

    private collectAnswer(clue: Clue): void {
        this.collected[clue] = true;
        this.selectedClue = null;
        this.render('galileo');
    }

    private answerArt(clue: Clue): string {
        return clue === 'moon' ? '问答页/月球介绍(线索)'
            : clue === 'jupiter' ? '问答页/木星介绍（线索）'
                : '问答页/重力介绍（线索）';
    }

    private dialogueArt(clue: Clue): string {
        return clue === 'moon' ? '问答页/月球回答（对话）'
            : clue === 'jupiter' ? '问答页/木星回答（对话）'
                : '问答页/重力回答（对话）';
    }

    private renderTelescope(): void {
        this.image('望远镜观测/镜头下2', 1920, 1341, 0, 0);
        this.back(() => this.close());
        this.label('望遠鏡をドラッグして、月と木星を観察しましょう', 31, 870, 55, 0, 440, this.content, true);

        this.lens = new Node('TelescopeLens');
        this.lens.layer = this.content.layer;
        this.lens.parent = this.content;
        this.lens.setPosition(-240, 0, 0);
        this.lens.addComponent(UITransform).setContentSize(430, 430);

        this.image('望远镜观测/镜头', 430, 430, 0, 0, this.lens);
        const aperture = new Node('Aperture');
        aperture.layer = this.content.layer;
        aperture.parent = this.lens;
        aperture.addComponent(UITransform).setContentSize(318, 318);
        const mask = aperture.addComponent(Mask);
        mask.type = Mask.Type.GRAPHICS_ELLIPSE;
        mask.segments = 64;
        this.starMap = this.image('望远镜观测/星空图', 1920, 1341, 240, 0, aperture);
        this.moonOutline = this.image('望远镜观测/线索/月球/月球描边', 310, 300, 0, 0, aperture);
        this.jupiterOutline = this.image('望远镜观测/线索/木星/木星描边', 290, 160, 0, 0, aperture);
        this.updateLensContents();

        this.lens.on(Node.EventType.TOUCH_START, this.onLensStart, this);
        this.lens.on(Node.EventType.TOUCH_MOVE, this.onLensMove, this);
        this.lens.on(Node.EventType.TOUCH_END, this.onLensEnd, this);
        this.lens.on(Node.EventType.TOUCH_CANCEL, this.onLensCancel, this);

        if (this.observedMoon) this.image('望远镜观测/线索/月球/月球背包缩略图', 85, 91, 840, 275);
        if (this.observedJupiter) this.image('望远镜观测/线索/木星/木星线索缩略图', 88, 81, 840, 145);
    }

    private onLensStart(event: EventTouch): void {
        if (this.viewingClue) return;
        const point = this.touchPosition(event);
        this.lensStart.set(this.lens.position);
        this.lensOffset.set(point.x - this.lens.position.x, point.y - this.lens.position.y, 0);
        this.lensMoving = false;
        event.propagationStopped = true;
    }

    private onLensMove(event: EventTouch): void {
        if (this.viewingClue || !this.lens?.isValid) return;
        const point = this.touchPosition(event);
        const x = Math.max(-710, Math.min(710, point.x - this.lensOffset.x));
        const y = Math.max(-360, Math.min(360, point.y - this.lensOffset.y));
        this.lensMoving = this.lensMoving || Vec3.distance(this.lensStart, new Vec3(x, y, 0)) > 12;
        this.lens.setPosition(x, y, 0);
        this.updateLensContents();
        event.propagationStopped = true;
    }

    private onLensEnd(event: EventTouch): void {
        if (!this.lens?.isValid || this.viewingClue) return;
        event.propagationStopped = true;
        if (this.lensMoving) return;
        if (!this.observedMoon && this.nearTarget('moon')) this.showObservation('moon');
        else if (!this.observedJupiter && this.nearTarget('jupiter')) this.showObservation('jupiter');
    }

    private onLensCancel(event: EventTouch): void {
        this.lensMoving = false;
        event.propagationStopped = true;
    }

    private updateLensContents(): void {
        if (!this.lens?.isValid) return;
        const position = this.lens.position;
        this.starMap.setPosition(-position.x, -position.y, 0);
        this.moonOutline.setPosition(
            OBSERVATION_POSITIONS.moon.x - position.x,
            OBSERVATION_POSITIONS.moon.y - position.y, 0,
        );
        this.jupiterOutline.setPosition(
            OBSERVATION_POSITIONS.jupiter.x - position.x,
            OBSERVATION_POSITIONS.jupiter.y - position.y, 0,
        );
        this.moonOutline.active = !this.observedMoon && this.nearTarget('moon');
        this.jupiterOutline.active = !this.observedJupiter && this.nearTarget('jupiter');
    }

    private nearTarget(clue: 'moon' | 'jupiter'): boolean {
        return Vec3.distance(this.lens.position, OBSERVATION_POSITIONS[clue]) < 120;
    }

    private showObservation(clue: 'moon' | 'jupiter'): void {
        this.viewingClue = clue;
        const path = clue === 'moon'
            ? '望远镜观测/线索/月球/月球简介悬浮框'
            : '望远镜观测/线索/木星/木星悬浮框';
        const card = this.image(path, 760, 317, 0, 0);
        this.touch(card, () => {
            if (clue === 'moon') this.observedMoon = true;
            else this.observedJupiter = true;
            this.render('telescope');
        });
    }

    private renderGravity(): void {
        this.image('重力实验/背景', 1920, 1341, 0, 0);
        this.image('重力实验/两只手', 1540, 294, 0, -245);
        this.image('重力实验/10kg', 245, 104, -685, -65);
        this.image('重力实验/1kg', 245, 104, 685, -65);
        const throwButton = this.image('重力实验/-下へ投げる-', 350, 58, 0, 345);
        this.touch(throwButton, () => { void this.playGravityExperiment(); });
        this.back(() => this.render('galileo'));
    }

    private async playGravityExperiment(): Promise<void> {
        const clip = await yy.AssetManager.loadVideo('Art', 'Video/Scene3/重力实验/落下动画');
        await yy.VideoManager.playLocalVideo({ clip });
        if (!this.node.isValid) return;
        this.gravityDone = true;
        this.selectedClue = 'gravity';
        this.render('galileo');
    }

    private renderChoice(): void {
        this.image('统一背景', 1920, 1341, 0, 0);
        this.image('是否认罪选择页/文字', 760, 509, 0, 175);
        const confess = this.image('是否认罪选择页/认罪', 320, 100, -220, -295);
        const refuse = this.image('是否认罪选择页/不认罪', 320, 100, 220, -295);
        this.touch(confess, () => { void this.playEnding('confess'); });
        this.touch(refuse, () => { void this.playEnding('refuse'); });
        this.back(() => this.render('galileo'));
    }

    private async playEnding(kind: 'confess' | 'refuse'): Promise<void> {
        if (this.endingPlaying) return;
        this.endingPlaying = true;
        this.ending = kind;
        const path = kind === 'confess'
            ? 'Video/Scene3/认错结局/烧书'
            : 'Video/Scene3/结局/被烧死结局/异端火';
        try {
            const clip = await yy.AssetManager.loadVideo('Art', path);
            await yy.VideoManager.playLocalVideo({ clip });
            if (this.node.isValid) this.render('ending');
        } finally {
            this.endingPlaying = false;
        }
    }

    private renderEnding(): void {
        if (this.ending === 'confess') {
            this.image('认错结局/火焰2', 1920, 1341, 0, 0);
            this.image('认错结局/星界の使者', 310, 334, 0, -100);
        } else {
            this.image('统一背景', 1920, 1341, 0, 0);
            this.image('结局/被烧死结局/異端火', 850, 436, 0, -145);
            this.image('结局/被烧死结局/引言', 800, 270, 0, 305);
        }
    }

    private allCollected(): boolean {
        return this.collected.moon && this.collected.jupiter && this.collected.gravity;
    }

    private image(path: string, width: number, height: number, x: number, y: number, parent = this.content): Node {
        const frame = this.frames.get(path);
        if (!frame) throw new Error('场景3缺少图片：' + path);
        const node = new Node(path);
        node.layer = parent.layer;
        node.parent = parent;
        node.setPosition(x, y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = frame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        node.getComponent(UITransform).setContentSize(width, height);
        return node;
    }

    private label(text: string, size: number, width: number, height: number,
        x: number, y: number, parent = this.content, light = false): Node {
        const node = new Node('SceneThreeLabel');
        node.layer = parent.layer;
        node.parent = parent;
        node.setPosition(parent === this.content ? x : x - parent.position.x,
            parent === this.content ? y : y - parent.position.y, 0);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 6;
        label.overflow = Label.Overflow.SHRINK;
        label.color = light || parent !== this.content
            ? new Color(255, 244, 224, 255) : new Color(66, 45, 33, 255);
        return node;
    }

    private back(action: () => void): void {
        const back = this.image('back', 90, 64, -880, 465);
        this.touch(back, action);
    }

    private touch(node: Node, action: () => void): void {
        node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            event.propagationStopped = true;
            action();
        }, this);
    }

    private touchPosition(event: EventTouch): Vec3 {
        const point = event.getUILocation();
        return this.content.getComponent(UITransform).convertToNodeSpaceAR(new Vec3(point.x, point.y, 0));
    }

    private close(): void {
        this.node.active = false;
        const callback = this.onExit;
        this.onExit = null;
        callback?.();
    }

    private adaptToScreen(): void {
        if (!this.content || !this.node.parent) return;
        const parentSize = this.node.parent.getComponent(UITransform)?.contentSize;
        if (!parentSize) return;
        this.node.getComponent(UITransform).setContentSize(parentSize);
        const scale = Math.min(parentSize.width / 1920, parentSize.height / 1080);
        this.content.setScale(scale, scale, 1);
    }
}

export async function showSceneThree(screen: 'galileo' | 'telescope', onExit: () => void): Promise<void> {
    let node = yy.UI.getChildByName('SceneThreeFlow');
    if (!node?.isValid) {
        node = new Node('SceneThreeFlow');
        node.layer = yy.UI.layer;
        node.parent = yy.UI;
        node.addComponent(UITransform).setContentSize(1920, 1080);
        node.addComponent(SceneThreeFlow);
    }
    const flow = node.getComponent(SceneThreeFlow);
    await flow.open(screen, onExit);
}
