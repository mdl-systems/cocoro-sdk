// ============================================================
// common.ts — 共通型定義
// ============================================================

/** HTTPエラーレスポンス */
export interface ApiError {
    detail: string
    status?: number
}

/** ページネーション共通 */
export interface PaginationParams {
    limit?: number
    offset?: number
}

/** タイムスタンプ付きレスポンス共通 */
export interface Timestamped {
    timestamp: string
}
