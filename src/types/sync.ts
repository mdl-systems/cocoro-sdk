// ============================================================
// sync.ts — シンクロ率型定義 (v0.3.0)
// ============================================================

/** シンクロ率のトレンド方向 */
export type SyncTrend = 'up' | 'down' | 'stable'

/** 現在のシンクロ率 */
export interface SyncRate {
    /** 現在のシンクロ率 (0.0 - 100.0) */
    rate: number
    /** トレンド方向 */
    trend: SyncTrend
    /** 前回比の変化量 */
    delta: number
    /** 計算時刻 */
    calculatedAt: string
    /** 過去24時間の最大値 */
    peakRate?: number
    /** 寄与因子 */
    factors?: {
        memoryConsistency?: number
        emotionalStability?: number
        responseCoherence?: number
        personalityAlignment?: number
    }
}

/** シンクロ率履歴エントリ */
export interface SyncHistoryEntry {
    date: string
    rate: number
    trend: SyncTrend
    delta: number
}

/** シンクロ率履歴レスポンス */
export interface SyncHistory {
    entries: SyncHistoryEntry[]
    days: number
    averageRate: number
}
