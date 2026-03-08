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
     */
    async send(req: ChatRequest): Promise<ChatResponse> {
        return this.http.request<ChatResponse>('/chat', {
            method: 'POST',
            body: {
                message: req.message,
                session_id: req.sessionId,
            },
        })
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
