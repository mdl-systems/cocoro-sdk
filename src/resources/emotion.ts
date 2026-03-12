// ============================================================
// emotion.ts — 感情状態リソース
// ============================================================

import type { HttpClient } from '../http.js'
import type { EmotionState } from '../types/emotion.js'

export class EmotionResource {
    constructor(private readonly http: HttpClient) { }

    /**
     * 現在の感情状態を取得（/personality/emotion）
     */
    async getState(): Promise<EmotionState> {
        return this.http.request<EmotionState>('/personality/emotion')
    }

    /**
     * emotionState() — getState() のエイリアス
     * v0.2.0 追加: より直感的な命名でアクセス可能
     *
     * @example
     * const emotion = await cocoro.emotion.emotionState()
     * console.log(emotion.dominant) // 'happiness' | 'sadness' | ...
     */
    async emotionState(): Promise<EmotionState> {
        return this.getState()
    }
}
