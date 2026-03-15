// ============================================================
// nodes.ts — ノード管理リソース (v0.3.0)
// ============================================================

import type { HttpClient } from '../http.js'
import type {
    CocoroNode,
    RegisterNodeParams,
    RegisterNodeResult,
    NodeListResponse,
} from '../types/node.js'

export class NodesResource {
    constructor(
        private readonly http: HttpClient,
        private readonly agentHttp: HttpClient | null = null,
    ) { }

    /** 実際のHTTPクライアントを選択（agentUrl優先） */
    private get _http(): HttpClient {
        return this.agentHttp ?? this.http
    }

    /**
     * 登録済みノード一覧を取得する
     *
     * @example
     * const nodes = await cocoro.nodes.list()
     * nodes.forEach(n => console.log(`${n.nodeId}: ${n.status}`))
     */
    async list(): Promise<CocoroNode[]> {
        const res = await this._http.request<NodeListResponse | CocoroNode[]>('/nodes')
        // レスポンスが { nodes: [...] } 形式か配列形式かを両対応
        if (Array.isArray(res)) return res
        return (res as NodeListResponse).nodes ?? []
    }

    /**
     * 特定ノードの詳細情報を取得する
     */
    async get(nodeId: string): Promise<CocoroNode> {
        return this._http.request<CocoroNode>(`/nodes/${nodeId}`)
    }

    /**
     * 新しいノードを登録する
     *
     * @example
     * await cocoro.nodes.register({
     *   nodeId: 'minipc-b',
     *   ip: '192.168.50.93',
     *   roles: ['lawyer'],
     * })
     */
    async register(params: RegisterNodeParams): Promise<RegisterNodeResult> {
        const raw = await this._http.request<any>('/nodes/register', {
            method: 'POST',
            body: {
                node_id: params.nodeId,
                ip: params.ip,
                port: params.port,
                roles: params.roles ?? [],
                metadata: params.metadata,
            },
        })

        return {
            nodeId: raw.nodeId ?? raw.node_id ?? params.nodeId,
            status: raw.status ?? 'registered',
            message: raw.message,
        }
    }

    /**
     * ノード情報を更新する
     */
    async update(nodeId: string, params: Partial<RegisterNodeParams>): Promise<CocoroNode> {
        return this._http.request<CocoroNode>(`/nodes/${nodeId}`, {
            method: 'PUT',
            body: {
                ip: params.ip,
                port: params.port,
                roles: params.roles,
                metadata: params.metadata,
            },
        })
    }

    /**
     * ノードの登録を解除する
     */
    async unregister(nodeId: string): Promise<{ success: boolean }> {
        return this._http.request<{ success: boolean }>(`/nodes/${nodeId}`, {
            method: 'DELETE',
        })
    }

    /**
     * ノードの死活確認
     */
    async ping(nodeId: string): Promise<{ alive: boolean; latencyMs?: number }> {
        return this._http.request(`/nodes/${nodeId}/ping`, {
            method: 'POST',
        })
    }
}
