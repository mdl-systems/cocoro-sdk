// ============================================================
// events.ts — WebSocketリアルタイムイベントリソース (v0.3.0)
// ============================================================

import type {
    CocoroEventType,
    CocoroEventMap,
    CocoroEvent,
} from '../types/events.js'

type EventHandler<T extends CocoroEventType> = (payload: CocoroEventMap[T]) => void
type AnyHandler = (payload: unknown) => void

/**
 * CocoroEventConnection — WebSocket接続ハンドル
 *
 * @example
 * const ws = cocoro.events.connect()
 * ws.on('task.completed', (event) => { console.log('完了:', event.title) })
 * ws.on('emotion.changed', (event) => { console.log('感情:', event.dominant) })
 *
 * // 切断
 * ws.close()
 */
export class CocoroEventConnection {
    private ws: WebSocket | null = null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handlers: Map<string, Set<AnyHandler>> = new Map()
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private closed = false

    /** 接続状態 */
    get readyState(): number {
        return this.ws?.readyState ?? WebSocket.CLOSED
    }

    constructor(
        private readonly url: string,
        private readonly token: string,
        private readonly reconnectDelayMs = 3000,
    ) {
        this._connect()
    }

    private _connect(): void {
        if (this.closed) return

        // WebSocket URLにトークンをクエリパラメータとして付与
        const wsUrl = this.token
            ? `${this.url}?token=${encodeURIComponent(this.token)}`
            : this.url

        try {
            this.ws = new WebSocket(wsUrl)
        } catch {
            this._scheduleReconnect()
            return
        }

        this.ws.onopen = () => {
            this._emit('connect' as CocoroEventType, { connected: true })
        }

        this.ws.onmessage = (event) => {
            try {
                const parsed: CocoroEvent = JSON.parse(event.data as string)
                if (parsed.event && parsed.data !== undefined) {
                    this._emit(parsed.event, parsed.data)
                }
            } catch {
                /* 非JSON メッセージは無視 */
            }
        }

        this.ws.onerror = () => {
            this._emit('error' as CocoroEventType, { message: 'WebSocket error' })
        }

        this.ws.onclose = (e) => {
            this._emit('disconnect' as CocoroEventType, { code: e.code, reason: e.reason })
            if (!this.closed) {
                this._scheduleReconnect()
            }
        }
    }

    private _scheduleReconnect(): void {
        if (this.closed || this.reconnectTimer != null) return
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this._connect()
        }, this.reconnectDelayMs)
    }

    private _emit(eventName: string, payload: unknown): void {
        const set = this.handlers.get(eventName)
        if (set) {
            set.forEach(handler => {
                try { handler(payload) } catch { /* ハンドラー内の例外は無視 */ }
            })
        }

        // ワイルドカードハンドラー
        const wildcard = this.handlers.get('*')
        if (wildcard) {
            wildcard.forEach(handler => {
                try { handler({ event: eventName, data: payload }) } catch { /* ignore */ }
            })
        }
    }

    /**
     * イベントハンドラーを登録する
     *
     * @example
     * ws.on('task.completed', (payload) => {
     *   console.log('タスク完了:', payload.title)
     * })
     */
    on<T extends CocoroEventType>(event: T, handler: EventHandler<T>): this
    on(event: string, handler: AnyHandler): this
    on(event: string, handler: AnyHandler): this {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set())
        }
        this.handlers.get(event)!.add(handler)
        return this
    }

    /**
     * イベントハンドラーを解除する
     */
    off<T extends CocoroEventType>(event: T, handler: EventHandler<T>): this
    off(event: string, handler: AnyHandler): this
    off(event: string, handler: AnyHandler): this {
        this.handlers.get(event)?.delete(handler)
        return this
    }

    /**
     * 1回だけ実行されるイベントハンドラーを登録する
     */
    once<T extends CocoroEventType>(event: T, handler: EventHandler<T>): this {
        const wrapper = (payload: unknown) => {
            this.off(event, wrapper as AnyHandler)
            ;(handler as AnyHandler)(payload)
        }
        this.on(event, wrapper as AnyHandler)
        return this
    }

    /**
     * WebSocket接続を閉じる
     */
    close(): void {
        this.closed = true
        if (this.reconnectTimer != null) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        this.ws?.close()
        this.ws = null
    }
}


/**
 * EventsResource — WebSocketイベント接続を管理するリソース
 */
export class EventsResource {
    constructor(
        private readonly wsBaseUrl: string,
        private readonly getToken: () => Promise<string>,
    ) { }

    /**
     * WebSocket接続を開始してイベントハンドルを返す
     *
     * @example
     * const ws = cocoro.events.connect()
     * ws.on('task.completed', (e) => console.log('完了:', e.title))
     * ws.on('emotion.changed', (e) => console.log('感情:', e.dominant))
     *
     * // 終了時
     * ws.close()
     */
    async connect(path = '/events/ws'): Promise<CocoroEventConnection> {
        const token = await this.getToken()
        const wsUrl = `${this.wsBaseUrl}${path}`
        return new CocoroEventConnection(wsUrl, token)
    }

    /**
     * 同期版 connect（トークン取得なし）
     * サーバーが認証不要な場合か、既にトークンを持っている場合に使用
     */
    connectSync(token: string, path = '/events/ws'): CocoroEventConnection {
        const wsUrl = `${this.wsBaseUrl}${path}`
        return new CocoroEventConnection(wsUrl, token)
    }
}
