// ============================================================
// memory.ts — メモリ管理リソース
// ============================================================

import type { HttpClient } from '../http.js'
import type {
    MemoryStats,
    MemoryEntry,
    MemorySearchResult,
    ShortTermParams,
    MemorySearchParams,
    VectorSearchParams,
} from '../types/memory.js'

export class MemoryResource {
    constructor(private readonly http: HttpClient) { }

    /** メモリ統計情報 */
    async getStats(): Promise<MemoryStats> {
        return this.http.request<MemoryStats>('/memory/stats')
    }

    /** 短期記憶（最近の会話）取得 */
    async getShortTerm(params: ShortTermParams = {}): Promise<MemoryEntry[]> {
        const qs = params.limit != null ? `?limit=${params.limit}` : ''
        return this.http.request<MemoryEntry[]>(`/memory/short-term${qs}`)
    }

    /** テキスト検索 */
    async search(params: MemorySearchParams): Promise<MemorySearchResult[]> {
        return this.http.request<MemorySearchResult[]>('/memory/search', {
            method: 'POST',
            body: {
                query: params.query,
                limit: params.limit ?? 5,
            },
        })
    }

    /** ベクトル類似検索 */
    async vectorSearch(params: VectorSearchParams): Promise<MemorySearchResult[]> {
        return this.http.request<MemorySearchResult[]>('/memory/vector-search', {
            method: 'POST',
            body: {
                query: params.query,
                limit: params.limit ?? 5,
                threshold: params.threshold,
            },
        })
    }
}
