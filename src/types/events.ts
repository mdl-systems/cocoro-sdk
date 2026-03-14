// ============================================================
// events.ts — WebSocketイベント型定義 (v0.3.0)
// ============================================================

/** イベント名の定義 */
export type CocoroEventType =
    | 'task.completed'
    | 'task.failed'
    | 'task.started'
    | 'task.progress'
    | 'emotion.changed'
    | 'memory.updated'
    | 'sync.rate.changed'
    | 'node.online'
    | 'node.offline'
    | 'ping'
    | 'error'

/** タスク完了イベントのペイロード */
export interface TaskCompletedPayload {
    taskId: string
    title: string
    duration: number | null
    result?: unknown
}

/** タスク失敗イベントのペイロード */
export interface TaskFailedPayload {
    taskId: string
    title: string
    error: string
}

/** タスク進捗イベントのペイロード */
export interface TaskProgressPayload {
    taskId: string
    title: string
    step: string
    progress: number
}

/** 感情変化イベントのペイロード */
export interface EmotionChangedPayload {
    dominant: string
    previous?: string
    intensity: number
    vector?: Record<string, number>
}

/** メモリ更新イベントのペイロード */
export interface MemoryUpdatedPayload {
    type: 'short_term' | 'long_term' | 'episodic'
    count: number
    latestSummary?: string
}

/** シンクロ率変化イベントのペイロード */
export interface SyncRateChangedPayload {
    rate: number
    previous: number
    delta: number
    trend: 'up' | 'down' | 'stable'
}

/** ノード状態変化イベントのペイロード */
export interface NodeStatusPayload {
    nodeId: string
    ip: string
    status: 'online' | 'offline'
}

/** イベントタイプ→ペイロードのマッピング */
export interface CocoroEventMap {
    'task.completed': TaskCompletedPayload
    'task.failed': TaskFailedPayload
    'task.started': { taskId: string; title: string }
    'task.progress': TaskProgressPayload
    'emotion.changed': EmotionChangedPayload
    'memory.updated': MemoryUpdatedPayload
    'sync.rate.changed': SyncRateChangedPayload
    'node.online': NodeStatusPayload
    'node.offline': NodeStatusPayload
    'ping': { timestamp: string }
    'error': { message: string; code?: number }
}

/** WebSocket経由で受信する汎用イベント */
export interface CocoroEvent<T extends CocoroEventType = CocoroEventType> {
    event: T
    data: CocoroEventMap[T]
    timestamp: string
}
