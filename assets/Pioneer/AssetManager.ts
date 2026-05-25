import {
    _decorator,
    assetManager,
    Asset,
    AssetManager as CCAssetManager,
    AudioClip,
    Prefab,
    SpriteAtlas,
    SpriteFrame,
    JsonAsset,
    Texture2D,
    VideoClip
} from 'cc';

const { ccclass } = _decorator;

/**
 * Bundle资源管理器
 */
@ccclass('AssetManager')
export class AssetManager {

    /** Bundle缓存 */
    private _bundleMap: Map<string, CCAssetManager.Bundle> = new Map();

    /** 资源缓存 */
    private _assetMap: Map<string, Asset> = new Map();

    /**
     * 加载Bundle
     */
    public loadBundle(bundleName: string): Promise<CCAssetManager.Bundle> {

        return new Promise((resolve, reject) => {

            // 已加载
            if (this._bundleMap.has(bundleName)) {

                resolve(this._bundleMap.get(bundleName)!);
                return;
            }

            assetManager.loadBundle(bundleName, (err, bundle) => {

                if (err) {

                    console.error(`加载Bundle失败: ${bundleName}`, err);

                    reject(err);
                    return;
                }

                this._bundleMap.set(bundleName, bundle);

                console.log(`Bundle加载成功: ${bundleName}`);

                resolve(bundle);
            });
        });
    }

    /**
     * 加载资源
     */
    public async load<T extends Asset>(
        bundleName: string,
        path: string,
        type: typeof Asset
    ): Promise<T> {

        const key = `${bundleName}/${path}`;

        // 已缓存
        if (this._assetMap.has(key)) {

            return this._assetMap.get(key) as T;
        }

        // 获取Bundle
        const bundle = await this.loadBundle(bundleName);

        return new Promise((resolve, reject) => {

            bundle.load(path, type, (err, asset) => {

                if (err) {

                    console.error(`资源加载失败: ${key}`, err);

                    reject(err);
                    return;
                }

                // 增加引用计数
                asset.addRef();

                this._assetMap.set(key, asset);

                resolve(asset as T);
            });
        });
    }

    /**
     * 加载预制体
     */
    public async loadPrefab(
        bundleName: string,
        path: string
    ): Promise<Prefab> {

        return await this.load<Prefab>(
            bundleName,
            path,
            Prefab
        );
    }

    /**
     * 加载SpriteFrame
     */
    public async loadSpriteFrame(
        bundleName: string,
        path: string
    ): Promise<SpriteFrame> {

        return await this.load<SpriteFrame>(
            bundleName,
            path,
            SpriteFrame
        );
    }

    /**
     * 加载图集
     */
    public async loadAtlas(
        bundleName: string,
        path: string
    ): Promise<SpriteAtlas> {

        return await this.load<SpriteAtlas>(
            bundleName,
            path,
            SpriteAtlas
        );
    }

    /**
     * 加载音频
     */
    public async loadAudio(
        bundleName: string,
        path: string
    ): Promise<AudioClip> {

        return await this.load<AudioClip>(
            bundleName,
            path,
            AudioClip
        );
    }

    /**
     * 加载视频
     */
    public async loadVideo(
        bundleName: string,
        path: string
    ): Promise<VideoClip> {

        return await this.load<VideoClip>(
            bundleName,
            path,
            VideoClip
        );
    }

    /**
     * 加载Json
     */
    public async loadJson(
        bundleName: string,
        path: string
    ): Promise<JsonAsset> {

        return await this.load<JsonAsset>(
            bundleName,
            path,
            JsonAsset
        );
    }

    /**
     * 加载Texture
     */
    public async loadTexture(
        bundleName: string,
        path: string
    ): Promise<Texture2D> {

        return await this.load<Texture2D>(
            bundleName,
            path,
            Texture2D
        );
    }

    /**
     * 释放单个资源
     */
    public release(
        bundleName: string,
        path: string
    ): void {

        const key = `${bundleName}/${path}`;

        const asset = this._assetMap.get(key);

        if (!asset) return;

        // 减少引用计数
        asset.decRef();

        this._assetMap.delete(key);

        console.log(`释放资源: ${key}`);
    }

    /**
     * 释放Bundle
     */
    public releaseBundle(bundleName: string): void {

        const bundle = this._bundleMap.get(bundleName);

        if (!bundle) return;

        bundle.releaseAll();

        assetManager.removeBundle(bundle);

        this._bundleMap.delete(bundleName);

        console.log(`释放Bundle: ${bundleName}`);
    }

    /**
     * 释放全部资源
     */
    public releaseAll(): void {

        this._assetMap.forEach((asset) => {

            asset.decRef();
        });

        this._assetMap.clear();

        this._bundleMap.forEach((bundle) => {

            bundle.releaseAll();

            assetManager.removeBundle(bundle);
        });

        this._bundleMap.clear();

        console.log('释放全部资源');
    }

    /**
     * 获取Bundle
     */
    public getBundle(bundleName: string): CCAssetManager.Bundle | null {

        return this._bundleMap.get(bundleName) || null;
    }

    /**
     * 获取缓存资源
     */
    public get<T extends Asset>(
        bundleName: string,
        path: string
    ): T | null {

        const key = `${bundleName}/${path}`;

        return (this._assetMap.get(key) as T) || null;
    }

    /**
     * 判断资源是否已加载
     */
    public has(
        bundleName: string,
        path: string
    ): boolean {

        const key = `${bundleName}/${path}`;

        return this._assetMap.has(key);
    }
}