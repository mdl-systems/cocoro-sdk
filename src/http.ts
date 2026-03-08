// ============================================================
// http.ts — 共通HTTPクライアント（fetch ラッパー）
// ============================================================

import { CocoroAuthError, CocoroError, CocoroNetworkError, CocoroTimeoutError } from './errors.js'
import type { AuthManager } from './auth.js'

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: unknown
    /** 認証ヘッダーをスキップする場合 true（auth自身のリクエストで使用） */
    skipAuth?: boolean
    timeout?: number
}

export class HttpClient {
    constructor(
        private readonly baseUrl: string,
        private readonly auth: AuthManager,
        private readonly defaultTimeout: number,
    ) { }

    async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
        const {
            method = 'GET',
            body,
            skipAuth = false,
            timeout = this.defaultTimeout,
        } = options

        const controller = new AbortController()
        const timerId = setTimeout(() => controller.abort(), timeout)

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            }

            if (!skipAuth) {
                const token = await this.auth.getToken()
                headers['Authorization'] = `Bearer ${token}`
            }

            const res = await fetch(`${this.baseUrl}${path}`, {
                method,
                headers,
                body: body != null ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            })

            // 401 → JWTキャッシュを無効化してリトライ（1回のみ）
            if (res.status === 401 && !skipAuth) {
                this.auth.invalidate()
                throw new CocoroAuthError()
            }

            if (res.status === 403) {
                throw new CocoroAuthError('アクセス権限がありません (403 Forbidden)')
            }

            if (!res.ok) {
                const bodyText = await res.text().catch(() => '')
                let detail = bodyText
                try {
                    detail = JSON.parse(bodyText)?.detail ?? bodyText
                } catch { /* ignore */ }
                throw new CocoroError(
                    `API エラー: ${res.status} ${res.statusText} — ${detail}`,
                    res.status,
                    bodyText,
                )
            }

            return res.json() as Promise<T>
        } catch (err) {
            if (err instanceof CocoroError) throw err
            if ((err as Error).name === 'AbortError') {
                throw new CocoroTimeoutError(timeout)
            }
            throw new CocoroNetworkError(
                `ネットワークエラー: ${(err as Error).message}`,
                err,
            )
        } finally {
            clearTimeout(timerId)
        }
    }

    /**
     * SSEストリーミング用：ReadableStream を返す
     */
    async stream(path: string, body: unknown, timeout = this.defaultTimeout): Promise<ReadableStream<string>> {
        const token = await this.auth.getToken()
        const controller = new AbortController()
        const timerId = setTimeout(() => controller.abort(), timeout)

        let res: Response
        try {
            res = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'text/event-stream',
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache',
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            })
        } catch (err) {
            clearTimeout(timerId)
            if ((err as Error).name === 'AbortError') throw new CocoroTimeoutError(timeout)
            throw new CocoroNetworkError(`ストリーム接続失敗: ${(err as Error).message}`, err)
        }

        if (res.status === 401 || res.status === 403) {
            clearTimeout(timerId)
            this.auth.invalidate()
            throw new CocoroAuthError()
        }

        if (!res.ok) {
            clearTimeout(timerId)
            throw new CocoroError(`ストリームエラー: ${res.status}`, res.status)
        }

        if (!res.body) {
            clearTimeout(timerId)
            throw new CocoroError('レスポンスボディが空です')
        }

        // タイマーをストリーム完了後にクリア
        const originalBody = res.body
        return new ReadableStream<string>({
            async start(controller_) {
                const reader = originalBody.getReader()
                const decoder = new TextDecoder()
                try {
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        controller_.enqueue(decoder.decode(value, { stream: true }))
                    }
                    controller_.close()
                } catch (err) {
                    controller_.error(err)
                } finally {
                    clearTimeout(timerId)
                    reader.releaseLock()
                }
            },
            cancel() {
                clearTimeout(timerId)
            },
        })
    }

    /**
     * GET ベースの SSE エンドポイントを非同期ジェネレーターで消費する
     * （cocoro-agent の GET /tasks/{id}/stream 用）
     */
    async *sseGet<T>(path: string): AsyncGenerator<T> {
        const token = await this.auth.getToken()
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'GET',
            headers: {
                'Accept': 'text/event-stream',
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
            },
        })

        if (!res.ok) {
            throw new CocoroError(`SSE接続エラー: ${res.status}`, res.status)
        }
        if (!res.body) {
            throw new CocoroError('SSEレスポンスボディが空です')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() ?? ''

                let eventName = 'message'
                let dataLine = ''

                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        eventName = line.slice(6).trim()
                    } else if (line.startsWith('data:')) {
                        dataLine = line.slice(5).trim()
                    } else if (line === '' && dataLine) {
                        try {
                            const parsed = JSON.parse(dataLine)
                            yield { event: eventName, data: parsed } as T
                        } catch { /* ping等の非JSONは無視 */ }
                        eventName = 'message'
                        dataLine = ''
                    }
                }

                if (eventName === 'completed' || eventName === 'failed') break
            }
        } finally {
            reader.releaseLock()
        }
    }
}
