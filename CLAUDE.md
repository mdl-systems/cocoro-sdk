# CLAUDE.md — cocoro-sdk

cocoro-core (FastAPI:8001) と cocoro-agent (FastAPI:8002) への TypeScript SDKです。
cocoro-website・cocoro-console・その他クライアントから使用されます。

## 開発コマンド

```bash
npm install          # 依存パッケージインストール
npm run dev          # watchモードでビルド（tsup --watch）
npm run build        # 本番ビルド (tsup → dist/)
npm test             # Vitest（watch mode）
npm run test:run     # Vitest（1回実行）
npm run type-check   # tsc --noEmit

# デモ実行（cocoro-agent起動中に）
npx tsx examples/agent-demo.ts
```

## ディレクトリ構成

```
src/
├── index.ts            ← 全エクスポートのエントリポイント（TaskHandle含む）
├── client.ts           ← CocoroClient（baseUrl + agentUrl 対応）
├── auth.ts             ← JWT自動取得・キャッシュ（55分有効）
├── http.ts             ← fetchラッパー（認証・エラー・SSE・sseGet）
├── errors.ts           ← CocoroError / CocoroAuthError / ...
├── resources/
│   ├── chat.ts         ← send() / stream() + ChatStream
│   ├── personality.ts
│   ├── emotion.ts
│   ├── memory.ts
│   ├── agent.ts        ← run() / stream() / result() / TaskHandle  ★ cocoro-agent対応
│   ├── monitor.ts
│   └── health.ts
├── types/
│   ├── chat.ts
│   ├── emotion.ts
│   ├── personality.ts
│   ├── memory.ts
│   ├── agent.ts        ← Task / OrgStatus / TaskStats / TaskProgressEvent 等
│   └── common.ts
└── examples/
    ├── basic-chat.ts
    ├── streaming-chat.ts
    └── agent-demo.ts   ← cocoro-agent E2Eデモ ★ NEW
```

## アーキテクチャ

```
CocoroClient(baseUrl, agentUrl?)
  ├── AuthManager (auth.ts)       ← JWT取得・キャッシュ（55分有効）
  ├── HttpClient  (http.ts)       ← fetch + 認証 + エラーマッピング + sseGet()
  ├── agentHttp   (HttpClient)    ← cocoro-agent用（agentUrl指定時）    ★ NEW
  └── Resources
      ├── ChatResource            → cocoro-core :8001
      ├── PersonalityResource     → cocoro-core :8001
      ├── EmotionResource         → cocoro-core :8001
      ├── MemoryResource          → cocoro-core :8001
      ├── AgentResource           → cocoro-agent :8002                   ★ NEW
      ├── MonitorResource         → cocoro-core :8001
      └── HealthResource          → cocoro-core :8001
```

## cocoro-agent 連携（AgentResource）★ NEW

```typescript
import { CocoroClient, TaskHandle } from 'cocoro-sdk'

const cocoro = new CocoroClient({
  baseUrl: 'http://192.168.50.92:8001',   // cocoro-core
  agentUrl: 'http://192.168.50.92:8002',  // cocoro-agent ← これを追加
  apiKey: process.env.COCORO_API_KEY!,
})

// ① タスク投入 → TaskHandle を返す
const task: TaskHandle = await cocoro.agent.run({
  title: 'AIトレンドをリサーチして',
  type: 'research',
})

// ② SSEで進捗をリアルタイム受信
for await (const event of task.stream()) {
  if (event.event === 'progress') console.log(event.data.step, event.data.progress + '%')
  if (event.event === 'completed') break
}

// ③ 最終結果取得
const result = await task.result()
console.log(result.result)

// ④ 統計
const stats = await cocoro.agent.getStats()

// ⑤ エージェント一覧
const agents = await cocoro.agent.list()

// ⑥ 組織状態
const org = await cocoro.agent.getOrgStatus()
```

## HttpClient.sseGet() ★ NEW

GET ベースのSSEエンドポイントを非同期ジェネレーターで消費します。
cocoro-agent の `GET /tasks/{id}/stream` に使用。

```typescript
// http.ts
async *sseGet<T>(path: string): AsyncGenerator<T>
// event: / data: の SSEフォーマットを自動パース
// completed / failed イベントで自動終了
```

## 重要ポイント

- **src/client.ts が起点**。`agentUrl` を渡すと `agentHttp` が初期化され `AgentResource` に注入
- **JWT認証は auth.ts が自動管理**（外部から意識不要）
- **501 認証フォールバック**: サーバーの `/auth/token` が 501 Not Implemented を返した場合 (JWT無効・APIキー認証モード時)、自動で API キーを Bearer トークンとしてフォールバック使用します。
- **SSEストリーミングは2種類**:
  - `chat.stream()` → POST SSE (cocoro-core)
  - `task.stream()` → GET SSE via `sseGet()` (cocoro-agent)
- **TaskHandle パターン**: `run()` → `stream()` → `result()` の3ステップ
- **`agentUrl` 省略時**: `AgentResource` は cocoro-core の `/agents` を使う（後方互換）

## cocoro-agent エンドポイント対応表

| SDKメソッド | HTTPエンドポイント |
|------------|-----------------|
| `agent.run(params)` | `POST /tasks` |
| `agent.list()` | `GET /agents` |
| `agent.get(id)` | `GET /agents/{id}` |
| `agent.getOrgStatus()` | `GET /org/status` |
| `agent.getStats()` | `GET /stats` |
| `task.refresh()` | `GET /tasks/{id}` |
| `task.stream()` | `GET /tasks/{id}/stream` (SSE) |
| `task.result()` | `GET /tasks/{id}/result` |

## 環境変数

```bash
COCORO_CORE_URL=http://192.168.50.92:8001
COCORO_AGENT_URL=http://192.168.50.92:8002   # NEW
COCORO_API_KEY=<your-api-key>
```

## 更新履歴

| 日付 | 更新内容 |
|------|---------| 
| 2026-03-08 | 初版: CocoroClient・ChatResource・全リソース・19テスト |
| 2026-03-09 | agentUrl対応・TaskHandle・sseGet・AgentResource全面刷新・types更新 |
| 2026-03-09 | 認証マネージャー: 501 Not Implemented時のAPIキーフォールバック対応 |
