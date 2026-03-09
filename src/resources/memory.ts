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

/** 削除系APIの共通レスポンス */
export interface DeleteResult {
    /** 実際に削除されたエントリ数 */
    deleted: number
    message?: string
}

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

    // ── 削除系 ────────────────────────────────────────────────

    /**
     * 指定IDのメモリエントリを1件削除する
     *
     * @example
     * const result = await cocoro.memory.deleteEntry('entry-uuid-xxxx')
     * console.log(`${result.deleted} 件削除`)
     */
    async deleteEntry(entryId: string): Promise<DeleteResult> {
        return this.http.request<DeleteResult>(`/memory/entries/${entryId}`, {
            method: 'DELETE',
        })
    }

    /**
     * 短期記憶（会話履歴）を全て削除する
     *
     * @example
     * const result = await cocoro.memory.clearShortTerm()
     * console.log(`短期記憶 ${result.deleted} 件を削除`)
     */
    async clearShortTerm(): Promise<DeleteResult> {
        return this.http.request<DeleteResult>('/memory/short-term', {
            method: 'DELETE',
        })
    }

    /**
     * 全メモリ（短期 + 長期 + エピソード）を削除する
     *
     * ⚠️ この操作は元に戻せません。
     *
     * @example
     * const result = await cocoro.memory.clearAll()
     * console.log(`全メモリ ${result.deleted} 件を削除`)
     */
    async clearAll(): Promise<DeleteResult> {
        return this.http.request<DeleteResult>('/memory/all', {
            method: 'DELETE',
        })
    }
}
