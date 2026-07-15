import { sys } from "cc";

export class LocalStorageManager {

    private static _instance: LocalStorageManager = null;

    public static get instance(): LocalStorageManager {
        if (!this._instance) {
            this._instance = new LocalStorageManager();
        }
        return this._instance;
    }


    /**
     * 保存字符串
     */
    public setString(key: string, value: string) {
        sys.localStorage.setItem(key, value);
    }


    /**
     * 获取字符串
     */
    public getString(key: string, defaultValue: string = ""): string {
        let value = sys.localStorage.getItem(key);

        if (value === null || value === undefined) {
            return defaultValue;
        }

        return value;
    }


    /**
     * 保存数字
     */
    public setNumber(key: string, value: number) {
        sys.localStorage.setItem(key, value.toString());
    }


    /**
     * 获取数字
     */
    public getNumber(key: string, defaultValue: number = 0): number {

        let value = sys.localStorage.getItem(key);

        if (value === null) {
            return defaultValue;
        }

        let num = Number(value);

        return isNaN(num) ? defaultValue : num;
    }


    /**
     * 保存布尔
     */
    public setBoolean(key: string, value: boolean) {

        sys.localStorage.setItem(
            key,
            value ? "true" : "false"
        );
    }


    /**
     * 获取布尔
     */
    public getBoolean(key: string, defaultValue: boolean = false): boolean {

        let value = sys.localStorage.getItem(key);

        if (value === null) {
            return defaultValue;
        }

        return value === "true";
    }



    /**
     * 保存对象
     */
    public setObject(key: string, value: any) {

        try {

            let json = JSON.stringify(value);

            sys.localStorage.setItem(key, json);

        } catch (e) {

            console.error(
                "LocalStorage 保存对象失败:",
                key,
                e
            );

        }

    }



    /**
     * 获取对象
     */
    public getObject<T>(key: string, defaultValue: T = null): T {

        let value = sys.localStorage.getItem(key);


        if (!value) {
            return defaultValue;
        }


        try {

            return JSON.parse(value);

        } catch (e) {

            console.error(
                "LocalStorage解析失败:",
                key
            );

            return defaultValue;
        }

    }



    /**
     * 删除数据
     */
    public remove(key: string) {

        sys.localStorage.removeItem(key);

    }



    /**
     * 清空所有数据
     */
    public clear() {

        sys.localStorage.clear();

    }



    /**
     * 判断是否存在
     */
    public has(key: string): boolean {

        return sys.localStorage.getItem(key) !== null;

    }

}