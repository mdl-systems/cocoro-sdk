// ============================================================
// health.ts — ヘルスチェックリソース
// ============================================================

import type { HttpClient } from '../http.js'

export interface HealthStatus {
    status: 'ok' | 'degraded' | 'down'
    version: string
    uptime: number
    services: {
        llm: 'ok' | 'error'
        memory: 'ok' | 'error'
        database: 'ok' | 'error'
    }
    timestamp: string
}

export class HealthResource {
    constructor(private readonly http: HttpClient) { }

    /** ヘルスチェック（認証不要） */
    async check(): Promise<HealthStatus> {
        return this.http.request<HealthStatus>('/health', { skipAuth: true })
    }
}
