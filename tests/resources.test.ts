// ============================================================
// resources.test.ts — Personality / Memory / Monitor / Health テスト
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CocoroClient, CocoroError, CocoroAuthError } from '../src/index.js'
import { createMockFetch, mockEmotion, mockTokenResponse } from './mock/server.js'

const BASE_URL = 'http://localhost:8001'
const API_KEY = 'test-api-key'

// ──────────────────────────────────────────
// Personality
// ──────────────────────────────────────────
describe('CocoroClient.personality', () => {
    const mockPersonality = {
        identity: { name: 'Cocoro', role: 'assistant', traits: ['curious', 'warm'] },
        values: {
            creativity: 0.8, empathy: 0.9, logic: 0.7, curiosity: 0.85,
            stability: 0.6, openness: 0.75, conscientiousness: 0.7, extraversion: 0.5,
        },
        beliefs: [],
        emotion: mockEmotion,
        goals: [],
    }

    const mockGrowth = {
        syncRate: 42.5,
        learningRate: 0.003,
        phase: 'accelerating' as const,
    }

    beforeEach(() => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { body: mockTokenResponse },
            '/personality/growth': { body: mockGrowth },
            '/personality': { body: mockPersonality },
        }))
    })

    afterEach(() => { vi.unstubAllGlobals() })

    it('personality.get() — 人格情報を返す', async () => {
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const p = await cocoro.personality.get()
        expect(p.identity.name).toBe('Cocoro')
        expect(p.values.empathy).toBe(0.9)
    })

    it('personality.getGrowth() — シンクロ率を返す', async () => {
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const g = await cocoro.personality.getGrowth()
        expect(g.syncRate).toBe(42.5)
        expect(g.phase).toBe('accelerating')
    })
})

// ──────────────────────────────────────────
// Emotion
// ──────────────────────────────────────────
describe('CocoroClient.emotion', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { body: mockTokenResponse },
            '/personality/emotion': { body: mockEmotion },
        }))
    })

    afterEach(() => { vi.unstubAllGlobals() })

    it('emotion.getState() — 感情状態を返す', async () => {
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const e = await cocoro.emotion.getState()
        expect(e.dominant).toBe('trust')
        expect(e.happiness).toBe(0.7)
    })
})

// ──────────────────────────────────────────
// Memory
// ──────────────────────────────────────────
describe('CocoroClient.memory', () => {
    const mockStats = {
        shortTermCount: 10,
        longTermCount: 245,
        episodicCount: 32,
        totalTokens: 18430,
        lastConsolidated: '2026-03-08T20:00:00Z',
    }

    const mockEntries = [
        { id: 'm1', content: 'こんにちは', role: 'user', timestamp: '2026-03-08T10:00:00Z' },
    ]

    const mockSearchResults = [
        { id: 'r1', content: '昨日の会話', score: 0.92, timestamp: '2026-03-07T10:00:00Z', type: 'long_term' },
    ]

    beforeEach(() => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { body: mockTokenResponse },
            '/memory/stats': { body: mockStats },
            '/memory/short-term': { body: mockEntries },
            '/memory/search': { body: mockSearchResults },
            '/memory/vector-search': { body: mockSearchResults },
        }))
    })

    afterEach(() => { vi.unstubAllGlobals() })

    it('memory.getStats() — 統計を返す', async () => {
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const stats = await cocoro.memory.getStats()
        expect(stats.longTermCount).toBe(245)
        expect(stats.totalTokens).toBe(18430)
    })

    it('memory.getShortTerm() — 短期記憶一覧を返す', async () => {
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const entries = await cocoro.memory.getShortTerm({ limit: 5 })
        expect(entries).toHaveLength(1)
        expect(entries[0].content).toBe('こんにちは')
    })

    it('memory.search() — テキスト検索結果を返す', async () => {
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const results = await cocoro.memory.search({ query: '昨日', limit: 3 })
        expect(results[0].score).toBe(0.92)
    })

    it('memory.vectorSearch() — ベクトル検索結果を返す', async () => {
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const results = await cocoro.memory.vectorSearch({ query: '旅行', limit: 3 })
        expect(results[0].type).toBe('long_term')
    })
})

// ──────────────────────────────────────────
// Health (認証不要)
// ──────────────────────────────────────────
describe('CocoroClient.health', () => {
    const mockHealth = {
        status: 'ok',
        version: '0.5.0',
        uptime: 3600,
        services: { llm: 'ok', memory: 'ok', database: 'ok' },
        timestamp: '2026-03-08T23:00:00Z',
    }

    beforeEach(() => {
        vi.stubGlobal('fetch', createMockFetch({
            '/health': { body: mockHealth },
        }))
    })

    afterEach(() => { vi.unstubAllGlobals() })

    it('health.check() — 認証ヘッダーなしでヘルス情報を返す', async () => {
        const fetchSpy = vi.fn(createMockFetch({ '/health': { body: mockHealth } }))
        vi.stubGlobal('fetch', fetchSpy)

        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        const h = await cocoro.health.check()

        expect(h.status).toBe('ok')
        expect(h.version).toBe('0.5.0')

        // Authorization ヘッダーなし = /auth/token も呼ばれていない
        const calls = fetchSpy.mock.calls
        const authCalls = calls.filter(([url]) => (url as string).includes('/auth/token'))
        expect(authCalls).toHaveLength(0)
    })
})

// ──────────────────────────────────────────
// エラーハンドリング
// ──────────────────────────────────────────
describe('エラーハンドリング', () => {
    afterEach(() => { vi.unstubAllGlobals() })

    it('CocoroAuthError — 401 のとき投げる', async () => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { status: 401, body: { detail: 'Unauthorized' } },
        }))
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        await expect(cocoro.personality.get()).rejects.toThrow(CocoroAuthError)
    })

    it('CocoroError — 500 のとき投げる', async () => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { body: mockTokenResponse },
            '/personality': { status: 500, body: { detail: 'Internal Server Error' } },
        }))
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        try {
            await cocoro.personality.get()
            expect.fail('エラーが投げられるべき')
        } catch (err) {
            expect(err).toBeInstanceOf(CocoroError)
            expect((err as CocoroError).status).toBe(500)
        }
    })

    it('CocoroAuthError — chat.send() が 401 のとき投げる', async () => {
        vi.stubGlobal('fetch', createMockFetch({
            '/auth/token': { status: 403, body: { detail: 'Forbidden' } },
        }))
        const cocoro = new CocoroClient({ baseUrl: BASE_URL, apiKey: API_KEY })
        await expect(cocoro.chat.send({ message: 'hello' })).rejects.toThrow(CocoroAuthError)
    })
})
