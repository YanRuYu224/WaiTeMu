import { _decorator, Component, Node, VideoPlayer } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Init')
export class Init extends Component {
    @property(VideoPlayer)
    video_player: VideoPlayer = null;

    protected onLoad(): void {

    }


}
