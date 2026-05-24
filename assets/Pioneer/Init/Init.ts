import { _decorator, Component, director, Node, VideoPlayer } from 'cc';
import { Pioneer } from '../Pioneer';
const { ccclass, property } = _decorator;

@ccclass('Init')
export class Init extends Component {

    protected onLoad(): void {
        Pioneer.instance.init();

        director.loadScene(`Main`);
    }


}
