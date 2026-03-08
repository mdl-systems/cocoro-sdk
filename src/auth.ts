// ============================================================
// auth.ts — JWT取得・キャッシュ管理
// ============================================================

import { CocoroAuthError, CocoroNetworkError, CocoroTimeoutError } from './errors.js'

interface AuthManagerOptions {
    baseUrl: string
    apiKey: string
    timeout: number
}

interface TokenResponse {
    access_token: string
    token_type: string
    expires_in?: number
}

/**
 * JWT認証マネージャー
 * JWTを自動取得・キャッシュし、有効期限前に自動更新する
 */
export class AuthManager {
    private token: string | null = null
    private expiresAt: number = 0

    private readonly baseUrl: string
    private readonly apiKey: string
    private readonly timeout: number

    constructor(options: AuthManagerOptions) {
        this.baseUrl = options.baseUrl
        this.apiKey = options.apiKey
        this.timeout = options.timeout
    }

    /**
     * 有効なJWTを返す（キャッシュヒット時は再利用、期限切れ時は自動更新）
     */
    async getToken(): Promise<string> {
        if (this.token && Date.now() < this.expiresAt) {
            return this.token
        }
        return this.refreshToken()
    }

    /**
     * キャッシュをクリアし、次回 getToken() 時に強制再取得させる
     */
    invalidate(): void {
        this.token = null
        this.expiresAt = 0
    }

    private async refreshToken(): Promise<string> {
        const controller = new AbortController()
        const timerId = setTimeout(() => controller.abort(), this.timeout)

        try {
            const res = await fetch(`${this.baseUrl}/auth/token`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey,
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
            })

            if (res.status === 401 || res.status === 403) {
                throw new CocoroAuthError()
            }

            if (!res.ok) {
                const body = await res.json().catch(() => null)
                throw new CocoroAuthError(
                    `認証失敗: HTTP ${res.status} ${res.statusText}`,
                )
            }

            const data: TokenResponse = await res.json()
            this.token = data.access_token

            // expires_in が返ってきた場合はそれを、なければ55分をキャッシュ期限に設定
            const expiresIn = data.expires_in ?? 55 * 60
            this.expiresAt = Date.now() + (expiresIn - 5 * 60) * 1000  // 5分余裕

            return this.token
        } catch (err) {
            if (err instanceof CocoroAuthError) throw err
            if ((err as Error).name === 'AbortError') {
                throw new CocoroTimeoutError(this.timeout)
            }
            throw new CocoroNetworkError(
                `cocoro-core への接続に失敗しました: ${(err as Error).message}`,
                err,
            )
        } finally {
            clearTimeout(timerId)
        }
    }
}
