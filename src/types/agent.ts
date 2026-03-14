// ============================================================
// agent.ts — エージェント型定義（cocoro-agent v0.3.0対応）
// ============================================================

export type AgentStatus = 'idle' | 'busy' | 'offline'
export type TaskStatus  = 'queued' | 'running' | 'completed' | 'failed'
export type TaskPriority = 'low' | 'normal' | 'high'
export type TaskType = 'research' | 'write' | 'analyze' | 'schedule' | 'auto'

export interface EmotionSnapshot {
    dominant: string
    happiness: number
    trust?: number
    anticipation?: number
}

export interface PersonalityInfo {
    traits: string[]
    emotion: EmotionSnapshot
}

/** cocoro-agent から返るエージェント情報 */
export interface Agent {
    id: string
    name: string
    department: string
    status: AgentStatus
    currentTask: string | null
    completedTasks: number
    failedTasks: number
    avgResponseTimeMs: number
    personality?: PersonalityInfo
    lastActiveAt: string | null
}

/** 部門統計 */
export interface DepartmentStats {
    agents: number
    activeTasks: number
}

/** 組織全体の状態 */
export interface OrgStatus {
    departments: Record<string, DepartmentStats>
    totalTasks: {
        queued: number
        running: number
        completed: number
        failed?: number
    }
}

/** タスク */
export interface Task {
    task_id: string
    status: TaskStatus
    title: string
    assignedTo: string | null
    estimatedSeconds: number | null
    createdAt: string
    updatedAt: string | null
    progress: number
    currentStep: string | null
    result: unknown | null
    error: string | null
    emotion: EmotionSnapshot | null
}

/** タスク結果 */
export interface TaskResult {
    task_id: string
    status: TaskStatus
    result: unknown | null
    toolsUsed: string[]
    duration: number | null
    completedAt: string | null
    error: string | null
}

/** タスク一覧レスポンス */
export interface TaskListResponse {
    tasks: Task[]
    total: number
    limit: number
    offset: number
}

/** タスク作成パラメータ */
export interface CreateTaskParams {
    title: string
    description?: string
    type?: TaskType
    assignTo?: string
    priority?: TaskPriority
    webhookUrl?: string
}

/** ロール指定タスク実行パラメータ (v0.3.0) */
export interface RunWithRoleParams {
    /** ロール名（例: 'lawyer', 'researcher', 'accountant'） */
    role: string
    /** エージェントへの指示 */
    instruction: string
    /** 出力フォーマット（例: 'markdown', 'json', 'plain'） */
    outputFormat?: 'markdown' | 'json' | 'plain' | string
    /** タスクの優先度 */
    priority?: TaskPriority
    /** Webhook URL */
    webhookUrl?: string
    /** 追加コンテキスト */
    context?: Record<string, unknown>
}

/** ロール指定タスクの実行結果 (v0.3.0) */
export interface RoleTaskResult extends TaskResult {
    /** 実行したロール */
    role: string
    /** 出力フォーマット */
    outputFormat?: string
}

/** タスク一覧パラメータ */
export interface ListTasksParams {
    status?: TaskStatus
    limit?: number
    offset?: number
}

/** SSEプログレスイベント */
export interface TaskProgressEvent {
    event: 'progress' | 'completed' | 'failed' | 'tool_use' | 'ping' | 'error'
    data: {
        step?: string
        progress?: number
        result?: unknown
        duration?: number
        tool?: string
        query?: string
        error?: string
    }
}

/** タスク統計 */
export interface TaskStats {
    total: number
    byStatus: Record<string, number>
    byAgent: Array<{ agent: string; count: number; avgDuration: number }>
    recentTasks: Task[]
}
