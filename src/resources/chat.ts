// ============================================================
// chat.ts — チャット・SSEストリーミングリソース
// ============================================================

import type { HttpClient } from '../http.js'
import type {
    ChatRequest,
    ChatResponse,
    ChatStreamChunk,
    ChatStreamFinal,
} from '../types/chat.js'

/**
 * SSEストリームのAsyncIterable + final() メタ情報取得
 */
export class ChatStream implements AsyncIterable<ChatStreamChunk> {
    private _final: ChatStreamFinal | null = null
    private _chunks: ChatStreamChunk[] = []
    private _done = false
    private _error: Error | null = null

    // 内部用：読み取り可能なRawストリームとPromise
    private _readableStream: ReadableStream<string>

    constructor(rawStream: ReadableStream<string>) {
        this._readableStream = rawStream
    }

    [Symbol.asyncIterator](): AsyncIterator<ChatStreamChunk> {
        const reader = this._readableStream.getReader()
        let buffer = ''
        const self = this

        return {
            async next(): Promise<IteratorResult<ChatStreamChunk>> {
                while (true) {
                    // バッファに完全なSSEイベントがあるか確認
                    const eventEnd = buffer.indexOf('\n\n')
                    if (eventEnd !== -1) {
                        const event = buffer.slice(0, eventEnd)
                        buffer = buffer.slice(eventEnd + 2)

                        const parsed = parseSseEvent(event)
                        if (!parsed) continue

                        // [DONE] シグナル
                        if (parsed.data === '[DONE]') {
                            self._done = true
                            return { done: true, value: undefined as unknown as ChatStreamChunk }
                        }

                        try {
                            const json = JSON.parse(parsed.data)

                            // final メタ情報（type=final のイベント）
                            if (json.type === 'final' || json.id) {
                                self._final = json as ChatStreamFinal
                                // finalが来たら終了
                                return { done: true, value: undefined as unknown as ChatStreamChunk }
                            }

                            // テキストチャンク
                            if (typeof json.text === 'string') {
                                const chunk: ChatStreamChunk = { text: json.text }
                                return { done: false, value: chunk }
                            }
                        } catch {
                            // JSON解析失敗は無視してスキップ
                            continue
                        }
                    }

                    // バッファが不足しているので次のチャンクを読む
                    let readResult: ReadableStreamReadResult<string>
                    try {
                        readResult = await reader.read()
                    } catch (err) {
                        self._error = err as Error
                        return { done: true, value: undefined as unknown as ChatStreamChunk }
                    }

                    if (readResult.done) {
                        // ストリーム終端
                        self._done = true
                        return { done: true, value: undefined as unknown as ChatStreamChunk }
                    }

                    buffer += readResult.value
                }
            },

            async return(): Promise<IteratorResult<ChatStreamChunk>> {
                reader.releaseLock()
                return { done: true, value: undefined as unknown as ChatStreamChunk }
            },
        }
    }

    /**
     * ストリーム完了後のメタ情報（emotion, action など）を取得
     * ストリームを全て消費してから呼ぶ必要がある
     */
    async final(): Promise<ChatStreamFinal | null> {
        return this._final
    }
}

/**
 * SSE行をパース
 * "data: {...}" → { data: "{...}" }
 */
function parseSseEvent(raw: string): { data: string } | null {
    let data = ''
    for (const line of raw.split('\n')) {
        if (line.startsWith('data: ')) {
            data += line.slice(6)
        }
    }
    return data ? { data } : null
}

// ============================================================

export class ChatResource {
    constructor(private readonly http: HttpClient) { }

    /**
     * 通常チャット（レスポンス一括取得）
     *
     * cocoro-core APIは snake_case フィールド名と文字列 emotion を返すため、
     * ここで SDK の ChatResponse 型（camelCase + EmotionState オブジェクト）に変換する。
     */
    async send(req: ChatRequest): Promise<ChatResponse> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await this.http.request<any>('/chat', {
            method: 'POST',
            body: {
                message: req.message,
                session_id: req.sessionId,
            },
        })

        // APIレスポンスを SDK 型に正規化
        // API: { response, session_id, action, emotion: string, task_id }
        // SDK: { id, text, action, emotion: EmotionState, sessionId, timestamp }
        const emotionName: string =
            typeof raw.emotion === 'string'
                ? raw.emotion
                : (raw.emotion?.dominant ?? 'neutral')

        const emotionState = typeof raw.emotion === 'object' && raw.emotion !== null
            ? raw.emotion
            : {
                happiness: emotionName === 'happiness' ? 0.8 : 0.0,
                sadness: emotionName === 'sadness' ? 0.8 : 0.0,
                anger: emotionName === 'anger' ? 0.8 : 0.0,
                fear: emotionName === 'fear' ? 0.8 : 0.0,
                trust: emotionName === 'trust' ? 0.8 : 0.0,
                surprise: emotionName === 'surprise' ? 0.8 : 0.0,
                dominant: emotionName,
            }

        return {
            id: raw.id ?? raw.session_id ?? '',
            text: raw.text ?? raw.response ?? '',
            action: raw.action ?? 'chat',
            emotion: emotionState,
            sessionId: raw.sessionId ?? raw.session_id ?? '',
            timestamp: raw.timestamp ?? new Date().toISOString(),
        }
    }

    /**
     * SSEストリーミングチャット
     * 返り値は AsyncIterable<ChatStreamChunk> + final() メソッド付き
     *
     * @example
     * const stream = await cocoro.chat.stream({ message: 'こんにちは' })
     * for await (const chunk of stream) {
     *   process.stdout.write(chunk.text)
     * }
     * const meta = await stream.final()
     */
    async stream(req: ChatRequest): Promise<ChatStream> {
        const raw = await this.http.stream('/chat/stream', {
            message: req.message,
            session_id: req.sessionId,
        })
        return new ChatStream(raw)
    }
}
