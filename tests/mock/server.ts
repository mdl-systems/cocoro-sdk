// ============================================================
// mock/server.ts — Vitestテスト用モックサーバー
// ============================================================

/**
 * インメモリのモックサーバーユーティリティ
 * vi.stubGlobal('fetch', createMockFetch(...)) で使用する
 */

export interface MockResponse {
    status?: number
    body?: unknown
    headers?: Record<string, string>
}

export type MockHandler = (url: string, init: RequestInit) => MockResponse | Promise<MockResponse>

/**
 * fetch をモックする関数を返す
 * handlers に URL パターン（部分一致）をキーとしてレスポンスを定義する
 *
 * @example
 * vi.stubGlobal('fetch', createMockFetch({
 *   '/auth/token': { body: { access_token: 'test-jwt', token_type: 'bearer' } },
 *   '/chat': { body: { id: '1', text: 'Hello', action: 'talk', emotion: mockEmotion, sessionId: 'sess1', timestamp: '' } },
 * }))
 */
export function createMockFetch(
    handlers: Record<string, MockResponse | MockHandler>,
): typeof fetch {
    return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input.toString()

        for (const [pattern, handlerOrResponse] of Object.entries(handlers)) {
            if (url.includes(pattern)) {
                const resolved =
                    typeof handlerOrResponse === 'function'
                        ? await handlerOrResponse(url, init ?? {})
                        : handlerOrResponse

                const status = resolved.status ?? 200
                const body = JSON.stringify(resolved.body ?? {})
                const headers = new Headers({
                    'Content-Type': 'application/json',
                    ...resolved.headers,
                })

                return new Response(body, { status, headers })
            }
        }

        // マッチなし → 404
        return new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404 })
    }
}

/** テスト用デフォルト感情状態 */
export const mockEmotion = {
    happiness: 0.7,
    sadness: 0.1,
    anger: 0.0,
    fear: 0.05,
    trust: 0.8,
    surprise: 0.2,
    dominant: 'trust',
}

/** テスト用デフォルトJWTレスポンス */
export const mockTokenResponse = {
    access_token: 'test-jwt-token-12345',
    token_type: 'bearer',
    expires_in: 3600,
}
