// ============================================================
// brief.ts — デイリーブリーフィングリソース (v0.3.0)
// ============================================================

import type { HttpClient } from '../http.js'
import type { DailyBriefing } from '../types/brief.js'

export class BriefResource {
    constructor(private readonly http: HttpClient) { }

    /**
     * 本日のデイリーブリーフィングを取得する
     *
     * @example
     * const brief = await cocoro.brief.daily()
     * console.log('サマリー:', brief.summary)
     * brief.recommendations?.forEach(r => console.log('- ' + r))
     */
    async daily(): Promise<DailyBriefing> {
        const raw = await this.http.request<any>('/brief/daily')

        return {
            date: raw.date ?? new Date().toISOString().slice(0, 10),
            summary: raw.summary ?? '',
            schedule: raw.schedule,
            emotionSummary: raw.emotionSummary ?? raw.emotion_summary,
            memoryHighlights: raw.memoryHighlights ?? raw.memory_highlights,
            recommendations: raw.recommendations,
            syncRate: raw.syncRate ?? raw.sync_rate,
            generatedAt: raw.generatedAt ?? raw.generated_at ?? new Date().toISOString(),
        }
    }

    /**
     * 指定日のブリーフィングを取得する
     *
     * @param date 'YYYY-MM-DD' 形式の日付
     *
     * @example
     * const brief = await cocoro.brief.get('2026-03-14')
     */
    async get(date: string): Promise<DailyBriefing> {
        const raw = await this.http.request<any>(`/brief/${date}`)

        return {
            date: raw.date ?? date,
            summary: raw.summary ?? '',
            schedule: raw.schedule,
            emotionSummary: raw.emotionSummary ?? raw.emotion_summary,
            memoryHighlights: raw.memoryHighlights ?? raw.memory_highlights,
            recommendations: raw.recommendations,
            syncRate: raw.syncRate ?? raw.sync_rate,
            generatedAt: raw.generatedAt ?? raw.generated_at ?? new Date().toISOString(),
        }
    }
}
