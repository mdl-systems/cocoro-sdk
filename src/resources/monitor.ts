// ============================================================
// monitor.ts — ノード監視・ダッシュボードリソース
// ============================================================

import type { HttpClient } from '../http.js'

export interface NodeDashboard {
    cpu: number           // CPU使用率 0-100
    memory: number        // メモリ使用率 0-100
    disk: number          // ディスク使用率 0-100
    uptime: number        // 秒
    status: 'healthy' | 'warning' | 'critical'
    activeConnections: number
    requestsPerMin: number
    timestamp: string
}

export class MonitorResource {
    constructor(private readonly http: HttpClient) { }

    /** ダッシュボード情報（CPU・メモリ・状態） */
    async getDashboard(): Promise<NodeDashboard> {
        return this.http.request<NodeDashboard>('/monitor/dashboard')
    }
}
