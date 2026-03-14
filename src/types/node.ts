// ============================================================
// node.ts — ノード管理型定義 (v0.3.0)
// ============================================================

/** ノードの稼働状態 */
export type NodeStatus = 'online' | 'offline' | 'degraded' | 'unknown'

/** ノード情報 */
export interface CocoroNode {
    nodeId: string
    ip: string
    port?: number
    roles: string[]
    status: NodeStatus
    version?: string
    registeredAt: string
    lastSeenAt: string | null
    /** CPU/メモリ等の簡易ステータス */
    resources?: {
        cpuPercent?: number
        memoryPercent?: number
    }
}

/** ノード登録パラメータ */
export interface RegisterNodeParams {
    nodeId: string
    ip: string
    port?: number
    roles?: string[]
    metadata?: Record<string, unknown>
}

/** ノード登録レスポンス */
export interface RegisterNodeResult {
    nodeId: string
    status: 'registered' | 'updated'
    message?: string
}

/** ノード一覧レスポンス */
export interface NodeListResponse {
    nodes: CocoroNode[]
    total: number
}
