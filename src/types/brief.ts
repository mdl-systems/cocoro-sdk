// ============================================================
// brief.ts — デイリーブリーフィング型定義 (v0.3.0)
// ============================================================

/** ブリーフィングのサマリーセクション */
export interface BriefingSection {
    title: string
    content: string
    priority?: 'high' | 'normal' | 'low'
}

/** デイリーブリーフィング */
export interface DailyBriefing {
    date: string
    summary: string
    /** スケジュール・タスク概要 */
    schedule?: BriefingSection[]
    /** エモーション状態サマリー */
    emotionSummary?: {
        dominant: string
        trend: string
        note?: string
    }
    /** メモリ学習ハイライト */
    memoryHighlights?: BriefingSection[]
    /** 推奨アクション */
    recommendations?: string[]
    /** シンクロ率 */
    syncRate?: {
        current: number
        trend: string
    }
    generatedAt: string
}
