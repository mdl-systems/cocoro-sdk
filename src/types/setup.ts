// ============================================================
// setup.ts — Boot Wizard / セットアップ型定義
// ============================================================

/** セットアップセッションのモード */
export type SetupMode = 'boot' | 'deep'

/** setupStart() のリクエスト */
export interface SetupStartRequest {
    mode: SetupMode
}

/** setupStart() のレスポンス */
export interface SetupSession {
    /** セッションID（以降の操作に使用） */
    sessionId: string
    /** セッション全体での質問数 */
    totalQuestions: number
    /** 最初の質問 */
    firstQuestion: SetupQuestion
}

/** セットアップ質問 */
export interface SetupQuestion {
    /** 質問ID */
    questionId: string
    /** 質問テキスト */
    text: string
    /** 選択肢（自由記述の場合は空配列） */
    options: string[]
    /** カテゴリ（例: 'values', 'personality', 'goals'） */
    category?: string
    /** 現在の質問番号（1始まり） */
    index: number
}

/** setupAnswer() のリクエスト */
export interface SetupAnswerRequest {
    sessionId: string
    questionId: string
    answer: string
}

/** setupAnswer() のレスポンス */
export interface SetupAnswerResult {
    /** 次の質問（なければ null = セットアップ完了） */
    nextQuestion: SetupQuestion | null
    /** 進捗（0-1） */
    progress: number
    /** セットアップ完了フラグ */
    completed: boolean
}

/** setupResult() のレスポンス — 分析・適用結果 */
export interface SetupResult {
    sessionId: string
    /** 分析ステータス */
    status: 'completed' | 'analyzing' | 'failed'
    /** 適用されたパーソナリティの概要 */
    summary?: string
    /** 値ベクトルの変化 */
    valuesApplied?: Record<string, number>
    /** 処理完了日時 */
    completedAt?: string
}
