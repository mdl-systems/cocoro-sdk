// ============================================================
// memory.ts — メモリ型定義
// ============================================================

export interface MemoryStats {
    shortTermCount: number
    longTermCount: number
    episodicCount: number
    totalTokens: number
    lastConsolidated: string | null
}

export interface MemoryEntry {
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: string
    sessionId?: string
    importance?: number
}

export interface MemorySearchResult {
    id: string
    content: string
    score: number
    timestamp: string
    type: 'short_term' | 'long_term' | 'episodic'
}

export interface ShortTermParams {
    limit?: number
}

export interface MemorySearchParams {
    query: string
    limit?: number
}

export interface VectorSearchParams {
    query: string
    limit?: number
    threshold?: number
}
