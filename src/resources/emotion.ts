// ============================================================
// emotion.ts — 感情状態リソース
// ============================================================

import type { HttpClient } from '../http.js'
import type { EmotionState } from '../types/emotion.js'

export class EmotionResource {
    constructor(private readonly http: HttpClient) { }

    /** 現在の感情状態を取得 */
    async getState(): Promise<EmotionState> {
        return this.http.request<EmotionState>('/personality/emotion')
    }
}
