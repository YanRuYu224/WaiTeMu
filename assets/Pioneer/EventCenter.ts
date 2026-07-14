// EventCenter.ts

type EventCallback = (...args: any[]) => void;

export class EventCenter {
    private static _instance: EventCenter;

    private events: Map<string, EventCallback[]> = new Map();

    private constructor() { }

    public static get instance(): EventCenter {
        if (!EventCenter._instance) {
            EventCenter._instance = new EventCenter();
        }
        return EventCenter._instance;
    }

    /**
     * 注册事件
     */
    public on(eventName: string, callback: EventCallback, target?: any) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const callbacks = this.events.get(eventName)!;

        // 防止重复注册
        const handler = target ? callback.bind(target) : callback;

        callbacks.push(handler);
    }


    /**
     * 派发事件
     */
    public emit(eventName: string, ...args: any[]) {
        const callbacks = this.events.get(eventName);

        if (!callbacks) return;

        callbacks.forEach(callback => {
            callback(...args);
        });
    }


    /**
     * 移除事件
     */
    public off(eventName: string, callback?: EventCallback) {

        if (!this.events.has(eventName)) return;

        if (!callback) {
            // 删除整个事件
            this.events.delete(eventName);
            return;
        }

        const callbacks = this.events.get(eventName)!;

        const index = callbacks.indexOf(callback);

        if (index !== -1) {
            callbacks.splice(index, 1);
        }

        if (callbacks.length === 0) {
            this.events.delete(eventName);
        }
    }


    /**
     * 清空所有事件
     */
    public clear() {
        this.events.clear();
    }
}


