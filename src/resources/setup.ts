// ============================================================
// setup.ts — Boot Wizard / セットアップリソース
// ============================================================

import type { HttpClient } from '../http.js'
import type {
    SetupMode,
    SetupSession,
    SetupAnswerResult,
    SetupResult,
} from '../types/setup.js'

export class SetupResource {
    constructor(private readonly http: HttpClient) { }

    /**
     * セットアップセッションを開始する（Boot Wizard）
     *
     * @param mode 'boot' = 初回起動ウィザード / 'deep' = 深層パーソナリティ設定
     *
     * @example
     * const session = await cocoro.setup.start('boot')
     * console.log('最初の質問:', session.firstQuestion.text)
     */
    async start(mode: SetupMode): Promise<SetupSession> {
        const raw = await this.http.request<any>('/setup/start', {
            method: 'POST',
            body: { mode },
        })

        // APIレスポンスの snake_case → camelCase 正規化
        return {
            sessionId: raw.sessionId ?? raw.session_id ?? '',
            totalQuestions: raw.totalQuestions ?? raw.total_questions ?? 0,
            firstQuestion: normalizeQuestion(raw.firstQuestion ?? raw.first_question ?? raw),
        }
    }

    /**
     * セットアップの質問に回答する
     *
     * @example
     * const next = await cocoro.setup.answer(sessionId, questionId, '好奇心旺盛')
     * if (next.completed) console.log('セットアップ完了！')
     * else console.log('次の質問:', next.nextQuestion?.text)
     */
    async answer(
        sessionId: string,
        questionId: string,
        answer: string,
    ): Promise<SetupAnswerResult> {
        const raw = await this.http.request<any>('/setup/answer', {
            method: 'POST',
            body: {
                session_id: sessionId,
                question_id: questionId,
                answer,
            },
        })

        return {
            nextQuestion: raw.next_question
                ? normalizeQuestion(raw.next_question)
                : (raw.nextQuestion ? normalizeQuestion(raw.nextQuestion) : null),
            progress: raw.progress ?? 0,
            completed: raw.completed ?? false,
        }
    }

    /**
     * セットアップ結果を取得し、パーソナリティへ適用する
     *
     * @example
     * const result = await cocoro.setup.result(sessionId)
     * console.log('ステータス:', result.status)
     */
    async result(sessionId: string): Promise<SetupResult> {
        const raw = await this.http.request<any>(`/setup/result/${sessionId}`)

        return {
            sessionId: raw.sessionId ?? raw.session_id ?? sessionId,
            status: raw.status ?? 'completed',
            summary: raw.summary,
            valuesApplied: raw.valuesApplied ?? raw.values_applied,
            completedAt: raw.completedAt ?? raw.completed_at,
        }
    }

    /**
     * セットアップの進捗状況を確認する
     *
     * @example
     * const progress = await cocoro.setup.progress(sessionId)
     */
    async progress(sessionId: string): Promise<{ progress: number; completed: boolean; currentQuestion?: any }> {
        return this.http.request(`/setup/progress/${sessionId}`)
    }
}

// ── ヘルパー ──────────────────────────────────────────────────

function normalizeQuestion(raw: any) {
    return {
        questionId: raw.questionId ?? raw.question_id ?? raw.id ?? '',
        text: raw.text ?? raw.question ?? '',
        options: raw.options ?? [],
        category: raw.category,
        index: raw.index ?? raw.question_number ?? 1,
    }
}
