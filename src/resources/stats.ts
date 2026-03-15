// ============================================================
// stats.ts — システム統計リソース (v1.1.0)
// ============================================================
// cocoro-core の /stats エンドポイントへのアクセスを提供する。
// エージェント統計（agent.getStats）とは別に、
// システム全体の統計情報を取得するためのリソース。
// ============================================================

import type { HttpClient } from '../http.js'

/** システム全体の統計情報 */
export interface SystemStats {
    /** 総チャット数（セッション数） */
    totalChats: number
    /** 今日のチャット数 */
    todayChats?: number
    /** 総メモリ件数 */
    totalMemories?: number
    /** 長期記憶件数 */
    longTermMemories?: number
    /** 短期記憶件数 */
    shortTermMemories?: number
    /** エピソード記憶件数 */
    episodicMemories?: number
    /** 総実行タスク数 */
    totalTasks?: number
    /** タスク完了率 (0.0 - 1.0) */
    taskSuccessRate?: number
    /** 現在のシンクロ率 */
    syncRate?: number
    /** 稼働時間（秒） */
    uptime?: number
    /** APIリクエスト総数 */
    totalRequests?: number
    /** 平均レスポンス時間（ms） */
    avgResponseTimeMs?: number
    /** 最終更新日時 */
    updatedAt: string
    /** 追加フィールドを受け入れる */
    [key: string]: unknown
}

import type { TaskStats } from '../types/agent.js'

/** パフォーマンスサマリー (cocoro-agent) */
export interface PerformanceSummary {
    node_id?: string
    performance?: {
        avg_latency_ms: number
        p95_latency_ms: number
        error_rate: number
        requests_total: number
    }
    [key: string]: unknown
}

export class StatsResource {
    constructor(
        private readonly http: HttpClient,
        private readonly agentHttp: HttpClient | null = null,
    ) { }

    /** 実際のHTTPクライアントを選択 */
    private get _agentHttp(): HttpClient {
        return this.agentHttp ?? this.http
    }

    /**
     * システム全体の統計情報を取得する
     *
     * @example
     * const stats = await cocoro.stats.get()
     * console.log(`総チャット数: ${stats.totalChats}`)
     * console.log(`シンクロ率: ${stats.syncRate}%`)
     * console.log(`稼働時間: ${Math.floor((stats.uptime ?? 0) / 3600)}時間`)
     */
    async get(): Promise<SystemStats> {
        const raw = await this.http.request<any>('/stats')

        return {
            totalChats: raw.totalChats ?? raw.total_chats ?? raw.total_sessions ?? 0,
            todayChats: raw.todayChats ?? raw.today_chats,
            totalMemories: raw.totalMemories ?? raw.total_memories,
            longTermMemories: raw.longTermMemories ?? raw.long_term_count ?? raw.long_term_memories,
            shortTermMemories: raw.shortTermMemories ?? raw.short_term_count ?? raw.short_term_memories,
            episodicMemories: raw.episodicMemories ?? raw.episodic_count ?? raw.episodic_memories,
            totalTasks: raw.totalTasks ?? raw.total_tasks,
            taskSuccessRate: raw.taskSuccessRate ?? raw.task_success_rate,
            syncRate: raw.syncRate ?? raw.sync_rate,
            uptime: raw.uptime,
            totalRequests: raw.totalRequests ?? raw.total_requests,
            avgResponseTimeMs: raw.avgResponseTimeMs ?? raw.avg_response_time_ms,
            updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
            ...raw,
        }
    }

    /**
     * メモリ統計を取得する（/stats/memory）
     *
     * @example
     * const mem = await cocoro.stats.memory()
     */
    async memory(): Promise<Pick<SystemStats, 'totalMemories' | 'longTermMemories' | 'shortTermMemories' | 'episodicMemories' | 'updatedAt'>> {
        try {
            const raw = await this.http.request<any>('/stats/memory')
            return {
                totalMemories: raw.totalMemories ?? raw.total ?? 0,
                longTermMemories: raw.longTermMemories ?? raw.long_term ?? raw.long_term_count,
                shortTermMemories: raw.shortTermMemories ?? raw.short_term ?? raw.short_term_count,
                episodicMemories: raw.episodicMemories ?? raw.episodic ?? raw.episodic_count,
                updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
            }
        } catch {
            // /stats/memory が存在しない場合は /stats にフォールバック
            return this.get()
        }
    }

    /**
     * チャット統計を取得する（/stats/chat）
     *
     * @example
     * const chat = await cocoro.stats.chat()
     */
    async chat(): Promise<{ totalChats: number; todayChats?: number; avgResponseTimeMs?: number; updatedAt: string }> {
        try {
            const raw = await this.http.request<any>('/stats/chat')
            return {
                totalChats: raw.totalChats ?? raw.total ?? raw.total_chats ?? 0,
                todayChats: raw.todayChats ?? raw.today,
                avgResponseTimeMs: raw.avgResponseTimeMs ?? raw.avg_response_time_ms,
                updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
            }
        } catch {
            const s = await this.get()
            return { totalChats: s.totalChats, todayChats: s.todayChats, avgResponseTimeMs: s.avgResponseTimeMs, updatedAt: s.updatedAt }
        }
    }

    // ── cocoro-agent エンドポイント (v1.1.0) ─────────────────────────────

    /**
     * エージェントタスク統計を取得する（cocoro-agent の GET /stats）
     *
     * @example
     * const stats = await cocoro.stats.getAgentStats()
     * console.log(`アクティブタスク: ${stats.active_tasks}`)
     */
    async getAgentStats(): Promise<TaskStats> {
        return this._agentHttp.request<TaskStats>('/stats')
    }

    /**
     * APIパフォーマンス情報を取得する（cocoro-agent の GET /stats/performance）
     *
     * @example
     * const perf = await cocoro.stats.getPerformance()
     * console.log(`平均レイテンシ: ${perf.performance?.avg_latency_ms}ms`)
     */
    async getPerformance(): Promise<PerformanceSummary> {
        return this._agentHttp.request<PerformanceSummary>('/stats/performance')
    }

    /**
     * スロータスク検出を手動トリガーする（cocoro-agent の POST /stats/check-slow）
     *
     * @param thresholdSec スロー判定しきい値（秒、デフォルト: 300）
     */
    async checkSlow(thresholdSec = 300): Promise<{
        slow_tasks_found: number
        threshold_seconds: number
        message: string
    }> {
        return this._agentHttp.request(`/stats/check-slow?threshold_sec=${thresholdSec}`, {
            method: 'POST',
        })
    }
}
