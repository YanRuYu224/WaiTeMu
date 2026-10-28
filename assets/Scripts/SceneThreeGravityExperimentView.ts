import { yy } from '../Pioneer/Pioneer';

/** Answer3 only creates and displays the authored experiment prefab. */
export async function showSceneThreeGravityExperiment(): Promise<void> {
    const node = await yy.UIManager.ShowUI('Prefabs/SceneThreeGravityExperiment', yy.UI);
    if (!node?.isValid) throw new Error('无法创建 SceneThreeGravityExperiment 预制体');
}
