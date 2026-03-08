// ============================================================
// personality.ts — 人格型定義
// ============================================================

import type { EmotionState } from './emotion.js'

/** 8次元価値ベクトル */
export interface ValueVector {
    creativity: number
    empathy: number
    logic: number
    curiosity: number
    stability: number
    openness: number
    conscientiousness: number
    extraversion: number
}

export interface Belief {
    id: string
    content: string
    strength: number    // 0-1
    category: string
}

export interface Goal {
    id: string
    description: string
    priority: number
    status: 'active' | 'completed' | 'paused'
}

export interface Personality {
    identity: {
        name: string
        role: string
        traits: string[]
    }
    values: ValueVector
    beliefs: Belief[]
    emotion: EmotionState
    goals: Goal[]
}

/** 成長・シンクロ率 */
export interface GrowthState {
    /** シンクロ率 0-100 */
    syncRate: number
    /** 現在の学習レート */
    learningRate: number
    phase: 'accelerating' | 'normal' | 'slowing' | 'ceiling'
}
