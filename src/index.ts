// ============================================================
// index.ts — エントリポイント（全エクスポート）
// ============================================================

// メインクライアント
export { CocoroClient } from './client.js'
export type { CocoroClientConfig } from './client.js'

// エラークラス
export {
    CocoroError,
    CocoroAuthError,
    CocoroTimeoutError,
    CocoroNetworkError,
} from './errors.js'

// リソース（型として使いたい場合）
export type { ChatStream } from './resources/chat.js'
export type { NodeDashboard } from './resources/monitor.js'
export type { HealthStatus } from './resources/health.js'
export { TaskHandle } from './resources/agent.js'
export type { SetupResource } from './resources/setup.js'
export { CocoroEventConnection } from './resources/events.js'

// 型定義 — Chat
export type {
    ChatRequest,
    ChatResponse,
    ChatStreamChunk,
    ChatStreamFinal,
} from './types/chat.js'

// 型定義 — Emotion
export type { EmotionState } from './types/emotion.js'

// 型定義 — Personality
export type {
    Personality,
    GrowthState,
    ValueVector,
    Belief,
    Goal,
} from './types/personality.js'

// 型定義 — Memory
export type {
    MemoryStats,
    MemoryEntry,
    MemorySearchResult,
    ShortTermParams,
    MemorySearchParams,
    VectorSearchParams,
} from './types/memory.js'
export type { DeleteResult } from './resources/memory.js'


// 型定義 — Agent (cocoro-agent対応)
export type {
    Agent,
    AgentStatus,
    OrgStatus,
    DepartmentStats,
    Task,
    TaskResult,
    TaskListResponse,
    CreateTaskParams,
    ListTasksParams,
    TaskStatus,
    TaskPriority,
    TaskType,
    TaskProgressEvent,
    TaskStats,
    EmotionSnapshot,
    PersonalityInfo,
    RunWithRoleParams,
    RoleTaskResult,
} from './types/agent.js'

// 型定義 — Common
export type { ApiError, PaginationParams, Timestamped } from './types/common.js'

// 型定義 — Setup (v0.2.0)
export type {
    SetupMode,
    SetupSession,
    SetupQuestion,
    SetupAnswerRequest,
    SetupAnswerResult,
    SetupResult,
} from './types/setup.js'

// 型定義 — Node (v0.3.0)
export type {
    CocoroNode,
    NodeStatus,
    RegisterNodeParams,
    RegisterNodeResult,
    NodeListResponse,
} from './types/node.js'

// 型定義 — Sync (v0.3.0)
export type {
    SyncRate,
    SyncTrend,
    SyncHistory,
    SyncHistoryEntry,
} from './types/sync.js'

// 型定義 — Brief (v0.3.0)
export type {
    DailyBriefing,
    BriefingSection,
} from './types/brief.js'

// 型定義 — Events / WebSocket (v0.3.0)
export type {
    CocoroEventType,
    CocoroEventMap,
    CocoroEvent,
    TaskCompletedPayload,
    TaskFailedPayload,
    TaskProgressPayload,
    EmotionChangedPayload,
    MemoryUpdatedPayload,
    SyncRateChangedPayload,
    NodeStatusPayload,
} from './types/events.js'
