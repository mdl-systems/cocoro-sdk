// ============================================================
// errors.ts — カスタムエラークラス
// ============================================================

/** cocoro-sdk 基底エラー */
export class CocoroError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly body?: unknown,
    ) {
        super(message)
        this.name = 'CocoroError'
        Object.setPrototypeOf(this, CocoroError.prototype)
    }
}

/** 認証エラー (401 / 403) */
export class CocoroAuthError extends CocoroError {
    constructor(message = '認証エラー: APIキーまたはJWTが無効です') {
        super(message, 401)
        this.name = 'CocoroAuthError'
        Object.setPrototypeOf(this, CocoroAuthError.prototype)
    }
}

/** タイムアウトエラー */
export class CocoroTimeoutError extends CocoroError {
    constructor(timeoutMs: number) {
        super(`タイムアウト: ${timeoutMs}ms を超過しました`)
        this.name = 'CocoroTimeoutError'
        Object.setPrototypeOf(this, CocoroTimeoutError.prototype)
    }
}

/** ネットワークエラー */
export class CocoroNetworkError extends CocoroError {
    constructor(message: string, public readonly cause?: unknown) {
        super(message)
        this.name = 'CocoroNetworkError'
        Object.setPrototypeOf(this, CocoroNetworkError.prototype)
    }
}
