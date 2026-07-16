import { _decorator, Component, director } from 'cc';
import { yy } from '../Pioneer';
const { ccclass, property } = _decorator;

@ccclass('Init')
export class Init extends Component {

    protected onLoad(): void {
        yy;
        director.loadScene(`Main`);
    }


}
