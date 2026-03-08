// ============================================================
// auth.test.ts — AuthManager テスト
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthManager } from '../src/auth.js'
import { CocoroAuthError, CocoroTimeoutError } from '../src/errors.js'
import { createMockFetch, mockTokenResponse } from './mock/server.js'

const BASE_URL = 'http://localhost:8001'
const API_KEY = 'test-api-key'

describe('AuthManager', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { body: mockTokenResponse },
        }))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('JWTを取得できる', async () => {
        const auth = new AuthManager({ baseUrl: BASE_URL, apiKey: API_KEY, timeout: 5000 })
        const token = await auth.getToken()
        expect(token).toBe('test-jwt-token-12345')
    })

    it('2回目はキャッシュを使う（fetchを1回しか呼ばない）', async () => {
        const fetchSpy = vi.fn(createMockFetch({ '/auth/token': { body: mockTokenResponse } }))
        vi.stubGlobal('fetch', fetchSpy)

        const auth = new AuthManager({ baseUrl: BASE_URL, apiKey: API_KEY, timeout: 5000 })
        await auth.getToken()
        await auth.getToken()

        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('invalidate() 後は再取得する', async () => {
        const fetchSpy = vi.fn(createMockFetch({ '/auth/token': { body: mockTokenResponse } }))
        vi.stubGlobal('fetch', fetchSpy)

        const auth = new AuthManager({ baseUrl: BASE_URL, apiKey: API_KEY, timeout: 5000 })
        await auth.getToken()
        auth.invalidate()
        await auth.getToken()

        expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('401 返時は CocoroAuthError を投げる', async () => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { status: 401, body: { detail: 'Unauthorized' } },
        }))

        const auth = new AuthManager({ baseUrl: BASE_URL, apiKey: API_KEY, timeout: 5000 })
        await expect(auth.getToken()).rejects.toThrow(CocoroAuthError)
    })
})
