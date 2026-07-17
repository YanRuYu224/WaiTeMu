import { sys } from "cc";
import { StorageName } from "./StorageName";

export class LocalStorageManager {
    private static _instance: LocalStorageManager | null = null;

    private constructor() { }

    public static get instance(): LocalStorageManager {
        if (!this._instance) {
            this._instance = new LocalStorageManager();
        }
        return this._instance;
    }

    /**
     * 保存字符串
     */
    public setString(key: string, value: string): boolean {
        return this.setItem(key, value);
    }

    /**
     * 获取字符串
     */
    public getString(key: string, defaultValue: string = ""): string {
        const value = this.getItem(key);
        return value === null ? defaultValue : value;
    }

    /**
     * 保存数字
     */
    public setNumber(key: string, value: number): boolean {
        if (!Number.isFinite(value)) {
            console.error("LocalStorage 保存数字失败，数值无效:", key, value);
            return false;
        }
        return this.setItem(key, value.toString());
    }

    /**
     * 获取数字
     */
    public getNumber(key: string, defaultValue: number = 0): number {
        const value = this.getItem(key);
        if (value === null) return defaultValue;

        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : defaultValue;
    }

    /**
     * 保存布尔值
     */
    public setBoolean(key: string, value: boolean): boolean {
        return this.setItem(key, value ? "true" : "false");
    }

    /**
     * 获取布尔值
     */
    public getBoolean(key: string, defaultValue: boolean = false): boolean {
        const value = this.getItem(key);
        if (value === "true") return true;
        if (value === "false") return false;
        return defaultValue;
    }

    /**
     * 保存对象
     */
    public setObject(key: string, value: unknown): boolean {
        try {
            const json = JSON.stringify(value);
            if (json === undefined) {
                console.error("LocalStorage 保存对象失败，数据无法序列化:", key);
                return false;
            }
            return this.setItem(key, json);
        } catch (error) {
            console.error("LocalStorage 保存对象失败:", key, error);
            return false;
        }
    }

    /**
     * 获取对象
     */
    public getObject<T>(key: string, defaultValue: T = null): T {
        const value = this.getItem(key);
        if (value === null) return defaultValue;

        try {
            return JSON.parse(value) as T;
        } catch (error) {
            console.error("LocalStorage 解析失败:", key, error);
            return defaultValue;
        }
    }

    /**
     * 删除数据
     */
    public remove(key: string): boolean {
        try {
            sys.localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error("LocalStorage 删除失败:", key, error);
            return false;
        }
    }

    /**
     * 清空本项目登记的所有数据
     */
    public clear(): void {
        Object.values(StorageName).forEach(key => this.remove(key));
    }

    /**
     * 判断是否存在
     */
    public has(key: string): boolean {
        return this.getItem(key) !== null;
    }

    private setItem(key: string, value: string): boolean {
        try {
            sys.localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error("LocalStorage 写入失败:", key, error);
            return false;
        }
    }

    private getItem(key: string): string | null {
        try {
            return sys.localStorage.getItem(key);
        } catch (error) {
            console.error("LocalStorage 读取失败:", key, error);
            return null;
        }
    }
}
