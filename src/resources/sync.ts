// ============================================================
// sync.ts — シンクロ率リソース (v0.3.0)
// ============================================================

import type { HttpClient } from '../http.js'
import type { SyncRate, SyncHistory } from '../types/sync.js'

export class SyncResource {
    constructor(private readonly http: HttpClient) { }

    /**
     * 現在のシンクロ率を取得する
     *
     * @example
     * const sync = await cocoro.sync.rate()
     * console.log(`シンクロ率: ${sync.rate}% (${sync.trend} / Δ${sync.delta})`)
     */
    async rate(): Promise<SyncRate> {
        const raw = await this.http.request<any>('/sync/rate')

        return {
            rate: raw.rate ?? raw.sync_rate ?? 0,
            trend: raw.trend ?? 'stable',
            delta: raw.delta ?? raw.delta_rate ?? 0,
            calculatedAt: raw.calculatedAt ?? raw.calculated_at ?? new Date().toISOString(),
            peakRate: raw.peakRate ?? raw.peak_rate,
            factors: raw.factors ?? raw.contributing_factors,
        }
    }

    /**
     * シンクロ率の履歴を取得する
     *
     * @param days 履歴を取得する日数（デフォルト: 30）
     *
     * @example
     * const history = await cocoro.sync.history(30)
     * history.entries.forEach(e => console.log(`${e.date}: ${e.rate}%`))
     */
    async history(days = 30): Promise<SyncHistory> {
        const raw = await this.http.request<any>(`/sync/history?days=${days}`)

        const entries = (raw.entries ?? raw.history ?? []).map((e: any) => ({
            date: e.date ?? e.timestamp ?? '',
            rate: e.rate ?? e.sync_rate ?? 0,
            trend: e.trend ?? 'stable',
            delta: e.delta ?? 0,
        }))

        return {
            entries,
            days: raw.days ?? days,
            averageRate: raw.averageRate ?? raw.average_rate ?? (
                entries.length > 0
                    ? entries.reduce((sum: number, e: any) => sum + e.rate, 0) / entries.length
                    : 0
            ),
        }
    }
}
