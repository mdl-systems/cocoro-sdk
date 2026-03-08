// ============================================================
// client.ts — CocoroClient メインクラス
// ============================================================

import { AuthManager } from './auth.js'
import { HttpClient } from './http.js'
import { ChatResource } from './resources/chat.js'
import { PersonalityResource } from './resources/personality.js'
import { EmotionResource } from './resources/emotion.js'
import { MemoryResource } from './resources/memory.js'
import { AgentResource } from './resources/agent.js'
import { MonitorResource } from './resources/monitor.js'
import { HealthResource } from './resources/health.js'

export interface CocoroClientConfig {
    /** cocoro-coreのベースURL（末尾スラッシュ不要）例: 'http://192.168.50.92:8001' */
    baseUrl: string
    /** cocoro-agentのURL（末尾スラッシュ不要）例: 'http://192.168.50.92:8002' */
    agentUrl?: string
    /** COCORO_API_KEY */
    apiKey: string
    /** タイムアウト（ms）デフォルト: 30000 */
    timeout?: number
    /** マルチユーザー用ユーザーID（省略時はデフォルト） */
    userId?: string
}

/**
 * CocoroClient — cocoro-core への統一クライアント
 *
 * @example
 * const cocoro = new CocoroClient({
 *   baseUrl: 'http://192.168.50.92:8001',
 *   apiKey: process.env.COCORO_API_KEY!,
 * })
 *
 * const res = await cocoro.chat.send({ message: 'こんにちは' })
 * console.log(res.text)
 */
export class CocoroClient {
    /** チャット・SSEストリーミング */
    readonly chat: ChatResource
    /** 人格情報・成長 */
    readonly personality: PersonalityResource
    /** 感情状態 */
    readonly emotion: EmotionResource
    /** メモリ管理 */
    readonly memory: MemoryResource
    /** エージェント管理 */
    readonly agent: AgentResource
    /** ノード監視 */
    readonly monitor: MonitorResource
    /** ヘルスチェック */
    readonly health: HealthResource

    private readonly _auth: AuthManager
    private readonly _http: HttpClient

    constructor(config: CocoroClientConfig) {
        const {
            baseUrl,
            agentUrl,
            apiKey,
            timeout = 30_000,
        } = config

        if (!baseUrl) throw new Error('CocoroClient: baseUrl は必須です')
        if (!apiKey) throw new Error('CocoroClient: apiKey は必須です')

        const normalizedBase = baseUrl.replace(/\/$/, '')  // 末尾スラッシュを除去

        this._auth = new AuthManager({
            baseUrl: normalizedBase,
            apiKey,
            timeout,
        })

        this._http = new HttpClient(normalizedBase, this._auth, timeout)

        // cocoro-agent 専用 HttpClient（agentUrl が指定されている場合）
        const agentHttp = agentUrl
            ? new HttpClient(agentUrl.replace(/\/$/, ''), this._auth, timeout)
            : null

        // リソース初期化
        this.chat = new ChatResource(this._http)
        this.personality = new PersonalityResource(this._http)
        this.emotion = new EmotionResource(this._http)
        this.memory = new MemoryResource(this._http)
        this.agent = new AgentResource(this._http, agentHttp)
        this.monitor = new MonitorResource(this._http)
        this.health = new HealthResource(this._http)
    }
}
