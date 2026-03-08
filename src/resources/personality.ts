// ============================================================
// personality.ts — 人格・成長リソース
// ============================================================

import type { HttpClient } from '../http.js'
import type { Personality, GrowthState } from '../types/personality.js'

export class PersonalityResource {
    constructor(private readonly http: HttpClient) { }

    /** 人格情報取得 */
    async get(): Promise<Personality> {
        return this.http.request<Personality>('/personality')
    }

    /** 成長・シンクロ率取得 */
    async getGrowth(): Promise<GrowthState> {
        return this.http.request<GrowthState>('/personality/growth')
    }
}
