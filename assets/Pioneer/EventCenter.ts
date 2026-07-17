// EventCenter.ts

type EventCallback = (...args: any[]) => void;

interface EventListener {
    callback: EventCallback;
    target?: any;
}

export class EventCenter {
    private static _instance: EventCenter;

    private events: Map<string, EventListener[]> = new Map();

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
    public addEventListener(eventName: string, callback: EventCallback, target?: any) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listeners = this.events.get(eventName)!;

        // 防止重复注册
        const exists = listeners.some(listener => {
            return listener.callback === callback && listener.target === target;
        });

        if (!exists) {
            listeners.push({ callback, target });
        }
    }


    /**
     * 派发事件
     */
    public dispatchEvent(eventName: string, ...args: any[]) {
        const listeners = this.events.get(eventName);

        if (!listeners) return;

        [...listeners].forEach(listener => {
            listener.callback.apply(listener.target, args);
        });
    }


    /**
     * 移除事件
     */
    public removeEventListener(eventName: string, callback?: EventCallback, target?: any) {

        if (!this.events.has(eventName)) return;

        if (!callback) {
            // 删除整个事件
            this.events.delete(eventName);
            return;
        }

        const listeners = this.events.get(eventName)!;
        const remaining = listeners.filter(listener => {
            if (listener.callback !== callback) return true;
            return target !== undefined && listener.target !== target;
        });

        if (remaining.length === 0) {
            this.events.delete(eventName);
        } else {
            this.events.set(eventName, remaining);
        }
    }

    /**
     * 移除指定目标注册的所有事件
     */
    public removeTargetListeners(target: any) {
        if (target === null || target === undefined) return;

        this.events.forEach((listeners, eventName) => {
            const remaining = listeners.filter(listener => listener.target !== target);

            if (remaining.length === 0) {
                this.events.delete(eventName);
            } else if (remaining.length !== listeners.length) {
                this.events.set(eventName, remaining);
            }
        });
    }


    /**
     * 清空所有事件
     */
    public clear() {
        this.events.clear();
    }
}


