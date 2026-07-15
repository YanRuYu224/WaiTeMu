import { _decorator, Enum, Node, VideoPlayer } from 'cc';
import { yy } from './Pioneer';
const { ccclass, property } = _decorator;

const ResourceType = Enum({
    /**
     * !#en The remote resource type.
     * !#zh 远程视频
     * @property {Number} REMOTE
     */
    REMOTE: 0,
    /**
     * !#en The local resouce type.
     * !#zh 本地视频
     * @property {Number} LOCAL
     */
    LOCAL: 1
});

@ccclass('VideoManager')
export class VideoManager {


    async playLocalVideo({ clip, rate = 1, volume = 1, mute = false, loop = false, keepRatio = false, full = true }): Promise<void> {
        return new Promise((resolve) => {
            yy.Video.children.forEach((node) => {
                node.destroy();
            });

            let node = new Node();
            node.parent = yy.Video;
            let videoPlayer = node.addComponent(VideoPlayer);
            videoPlayer.resourceType = ResourceType.LOCAL;
            videoPlayer.clip = clip;
            videoPlayer.playbackRate = rate;
            videoPlayer.volume = volume;
            videoPlayer.mute = mute;
            videoPlayer.loop = loop;
            videoPlayer.keepAspectRatio = keepRatio;
            videoPlayer.fullScreenOnAwake = full;

            videoPlayer.node.on(VideoPlayer.EventType.COMPLETED, () => {

                node.destroy();

                resolve();

            }, this);

            videoPlayer.play();
        })
    }
}


