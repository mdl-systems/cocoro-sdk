// ============================================================
// emotion.ts — 感情型定義
// ============================================================

/** 感情状態（0-1スケール） */
export interface EmotionState {
    happiness: number
    sadness: number
    anger: number
    fear: number
    trust: number
    surprise: number
    /** 最も強い感情名 */
    dominant: string
}
