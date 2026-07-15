import { Animation } from 'cc';

export function playAniSync(animation: Animation, aniName?) {
    return new Promise<void>((resolve, reject) => {
        animation.targetOff(Animation.EventType.FINISHED);
        animation.once(Animation.EventType.FINISHED, () => {
            resolve();
        }, animation);
        animation.play(aniName);
    });
}



