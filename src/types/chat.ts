// ============================================================
// chat.ts — チャット型定義
// ============================================================

import type { EmotionState } from './emotion.js'

export interface ChatRequest {
    message: string
    sessionId?: string
}

export interface ChatResponse {
    id: string
    text: string
    action: string
    emotion: EmotionState
    sessionId: string
    timestamp: string
}

/** SSEストリームの各チャンク */
export interface ChatStreamChunk {
    /** 文字単位のテキスト */
    text: string
}

/** SSEストリーム完了時のメタ情報 */
export interface ChatStreamFinal {
    id: string
    action: string
    emotion: EmotionState
    sessionId: string
}
