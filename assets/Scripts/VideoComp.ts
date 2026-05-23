import { _decorator, Component, Node, resources, VideoPlayer } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('VideoComp')
export class VideoComp extends Component {

    @property(VideoPlayer)
    video_player: VideoPlayer = null;

    protected onLoad(): void {

    }
}


