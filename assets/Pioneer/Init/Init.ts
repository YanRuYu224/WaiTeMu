import { _decorator, Component, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Init')
export class Init extends Component {

    protected onLoad(): void {
        director.loadScene(`Main`);
    }


}
