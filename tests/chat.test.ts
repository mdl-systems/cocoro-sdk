// ============================================================
// chat.test.ts — ChatResource テスト
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CocoroClient } from '../src/index.js'
import { createMockFetch, mockEmotion, mockTokenResponse } from './mock/server.js'

const BASE_URL = 'http://localhost:8001'
const API_KEY = 'test-api-key'

const mockChatResponse = {
    id: 'msg-001',
    text: 'こんにちは！元気ですよ。',
    action: 'talk',
    emotion: mockEmotion,
    sessionId: 'session-abc',
    timestamp: '2026-03-08T22:00:00Z',
}

describe('CocoroClient.chat', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { body: mockTokenResponse },
            '/chat': { body: mockChatResponse },
        }))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    describe('send()', () => {
        it('メッセージを送信してレスポンスを返す', async () => {
            const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
            const res = await cocoro.chat.send({ message: 'こんにちは' })

            expect(res.id).toBe('msg-001')
            expect(res.text).toBe('こんにちは！元気ですよ。')
            expect(res.emotion.dominant).toBe('trust')
        })

        it('sessionId を含めてリクエストできる', async () => {
            const fetchSpy = vi.fn(createMockFetch({
                '/auth/token': { body: mockTokenResponse },
                '/chat': { body: mockChatResponse },
            }))
            vi.stubGlobal('fetch', fetchSpy)

            const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
            await cocoro.chat.send({ message: 'hello', sessionId: 'sess-123' })

            // /chat への POST リクエストのボディを確認
            const chatCall = fetchSpy.mock.calls.find(([url]) =>
                (url as string).includes('/chat') && !(url as string).includes('stream')
            )
            expect(chatCall).toBeDefined()
            const body = JSON.parse(chatCall![1]!.body as string)
            expect(body.session_id).toBe('sess-123')
        })
    })

    describe('CocoroClient 初期化エラー', () => {
        it('baseUrl が空の場合にエラー', () => {
            expect(() => new CocoroClient({ baseUrl: '', apiKey: 'key' })).toThrow()
        })
        it('apiKey が空の場合にエラー', () => {
            expect(() => new CocoroClient({ baseUrl: BASE_URL, apiKey: '' })).toThrow()
        })
    })
})
