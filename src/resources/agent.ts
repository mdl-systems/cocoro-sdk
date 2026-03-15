// ============================================================
// agent.ts — cocoro-agent (port 8002) クライアントリソース
// ============================================================
// cocoro-agent は cocoro-core(8001) とは別サービス。
// AgentResource は agentUrl を使って 8002 に接続する。
// ============================================================

import type { HttpClient } from '../http.js'
import type {
    Agent,
    OrgStatus,
    Task,
    TaskResult,
    TaskListResponse,
    CreateTaskParams,
    ListTasksParams,
    TaskProgressEvent,
    TaskStats,
    RunWithRoleParams,
    RoleTaskResult,
} from '../types/agent.js'

/**
 * TaskHandle — run() が返すハンドルオブジェクト
 *
 * @example
 * const task = await cocoro.agent.run({ title: 'AIトレンドをリサーチして', type: 'research' })
 * for await (const event of task.stream()) {
 *   console.log(event.data.step, event.data.progress)
 * }
 * const result = await task.result()
 */
export class TaskHandle {
    constructor(
        private readonly task: Task,
        private readonly resource: AgentResource,
    ) { }

    get id(): string { return this.task.task_id }
    get status(): Task['status'] { return this.task.status }
    get title(): string { return this.task.title }

    /** SSEで進捗をリアルタイム受信する非同期ジェネレーター */
    async *stream(): AsyncGenerator<TaskProgressEvent> {
        yield* this.resource.streamTask(this.task.task_id)
    }

    /** 完了を待って最終結果を取得（ポーリング） */
    async result(pollIntervalMs = 2000, timeoutMs = 300_000): Promise<TaskResult> {
        return this.resource.waitForResult(this.task.task_id, pollIntervalMs, timeoutMs)
    }

    /** 現在の状態をリフレッシュして返す */
    async refresh(): Promise<Task> {
        return this.resource.getTask(this.task.task_id)
    }
}


export class AgentResource {
    constructor(
        private readonly http: HttpClient,
        private readonly agentHttp: HttpClient | null = null,
    ) { }

    /** 実際のHTTPクライアントを選択（agentUrl優先） */
    private get _http(): HttpClient {
        return this.agentHttp ?? this.http
    }

    // ── エージェント管理 ──────────────────────────────────────────────────

    /** エージェント一覧 */
    async list(): Promise<Agent[]> {
        const res = await this._http.request<{ agents: Agent[]; total: number }>('/agents')
        return res.agents
    }

    /** エージェント詳細 */
    async get(agentId: string): Promise<Agent> {
        return this._http.request<Agent>(`/agents/${agentId}`)
    }

    /** 組織状態 */
    async getOrgStatus(): Promise<OrgStatus> {
        return this._http.request<OrgStatus>('/org/status')
    }

    // ── タスク管理 ────────────────────────────────────────────────────────

    /**
     * タスクを投入してTaskHandleを返す（メインAPI）
     *
     * @example
     * const task = await cocoro.agent.run({
     *   title: 'AIトレンドをリサーチして',
     *   type: 'research',
     * })
     */
    async run(params: CreateTaskParams): Promise<TaskHandle> {
        const task = await this.createTask(params)
        return new TaskHandle(task, this)
    }

    /**
     * ロールを指定してタスクを実行する（v0.3.0）
     *
     * ロールを持つエージェントにタスクを割り当て、
     * 出力フォーマットを指定してTaskHandleを返す。
     *
     * @example
     * const task = await cocoro.agent.runWithRole({
     *   role: 'lawyer',
     *   instruction: 'この契約書を分析して',
     *   outputFormat: 'markdown',
     * })
     * for await (const event of task.stream()) {
     *   if (event.event === 'completed') break
     * }
     * const result = await task.result()
     */
    async runWithRole(params: RunWithRoleParams): Promise<TaskHandle> {
        const task = await this.createTask({
            title: `[${params.role}] ${params.instruction}`,
            description: params.instruction,
            type: 'auto',
            priority: params.priority,
            webhookUrl: params.webhookUrl,
        })
        return new TaskHandle(task, this)
    }

    /** タスク作成（低レベル） */
    async createTask(params: CreateTaskParams): Promise<Task> {
        return this._http.request<Task>('/tasks', {
            method: 'POST',
            body: {
                title: params.title,
                description: params.description,
                type: params.type ?? 'auto',
                assignTo: params.assignTo,
                role_id: params.roleId,
                output_format: params.outputFormat,
                priority: params.priority ?? 'normal',
                webhook_url: params.webhookUrl,
            },
        })
    }

    /** タスク一覧 */
    async listTasks(params: ListTasksParams = {}): Promise<TaskListResponse> {
        const qs = new URLSearchParams()
        if (params.status != null) qs.set('status', params.status)
        if (params.limit != null) qs.set('limit', String(params.limit))
        if (params.offset != null) qs.set('offset', String(params.offset))
        const q = qs.toString() ? `?${qs.toString()}` : ''
        return this._http.request<TaskListResponse>(`/tasks${q}`)
    }

    /** タスク状態取得 */
    async getTask(taskId: string): Promise<Task> {
        return this._http.request<Task>(`/tasks/${taskId}`)
    }

    /** タスク最終結果取得 */
    async getTaskResult(taskId: string): Promise<TaskResult> {
        return this._http.request<TaskResult>(`/tasks/${taskId}/result`)
    }

    /**
     * タスク結果取得（getTaskResultの短縮形エイリアス）
     *
     * @example
     * const task = await cocoro.agent.createTask({ title: 'Pythonでソートを実装して', roleId: 'engineer' })
     * // ... wait for completion
     * const result = await cocoro.agent.getResult(task.task_id)
     */
    async getResult(taskId: string): Promise<TaskResult> {
        return this.getTaskResult(taskId)
    }

    /**
     * タスク完了まで待機してresultを返す（ポーリング）
     * completed/failedになるまで pollIntervalMs ごとにGETでポーリングする。
     */
    async waitForResult(
        taskId: string,
        pollIntervalMs = 2000,
        timeoutMs = 300_000,
    ): Promise<TaskResult> {
        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
            const task = await this.getTask(taskId)
            if (task.status === 'completed' || task.status === 'failed') {
                return this.getTaskResult(taskId)
            }
            await new Promise(r => setTimeout(r, pollIntervalMs))
        }
        throw new Error(`Task ${taskId} timed out after ${timeoutMs}ms`)
    }

    // ── SSEストリーミング ─────────────────────────────────────────────────

    /**
     * GET /tasks/{id}/stream をSSEで購読する非同期ジェネレーター
     *
     * @example
     * for await (const event of cocoro.agent.streamTask(taskId)) {
     *   if (event.event === 'progress') console.log(event.data.step, event.data.progress)
     *   if (event.event === 'completed') break
     * }
     */
    async *streamTask(taskId: string): AsyncGenerator<TaskProgressEvent> {
        yield* this._http.sseGet<TaskProgressEvent>(`/tasks/${taskId}/stream`)
    }

    // ── Webhook ───────────────────────────────────────────────────────────

    /** Webhookテスト送信 */
    async testWebhook(url: string, event = 'task.completed'): Promise<{ success: boolean }> {
        return this._http.request('/webhooks/test', {
            method: 'POST',
            body: { url, event },
        })
    }

    /** タスク統計 */
    async getStats(): Promise<TaskStats> {
        return this._http.request<TaskStats>('/stats')
    }
}
