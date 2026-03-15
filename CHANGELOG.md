# Changelog

All notable changes to `@mdl-systems/cocoro-sdk` are documented here.

---

## [1.1.0] — 2026-03-15

### Added

#### Nodes API 拡張
- `cocoro.nodes.register()` — `port` フィールドのサポートを確認・整備
- ノード登録時に `roles` 配列でエージェントロールを指定可能

#### Agent Tasks 拡張（`agent.createTask` 強化）
- `CreateTaskParams` に `roleId` フィールドを追加（ロールを持つエージェントに割り当て）
- `CreateTaskParams` に `outputFormat` フィールドを追加 (`'markdown'` / `'json'` / `'plain'`)
- `body` パラメータの `role_id` / `output_format` として cocoro-core に送信
- `agent.getResult(taskId)` — `getTaskResult()` のエイリアスを追加

#### Stats API（新規）
- `cocoro.stats.get()` — システム全体の統計情報取得 (`GET /stats`)
  - `totalChats`, `totalMemories`, `syncRate`, `uptime`, `avgResponseTimeMs` 等
- `cocoro.stats.memory()` — メモリ統計取得 (`GET /stats/memory`、フォールバック対応)
- `cocoro.stats.chat()` — チャット統計取得 (`GET /stats/chat`、フォールバック対応)
- 新規型定義: `SystemStats`

### Fixed

- `basic-chat.ts` の接続テストで cocoro-core (`192.168.50.92:8001`) への接続を確認済み ✅
  - `status=healthy, version=1.0.0` で応答確認

---

## [1.0.0] — 2026-03-14


### Changed

- **バージョン 1.0.0 正式リリース** — npm publish 対応
- `package.json`: `files`, `keywords`, `repository`, `publishConfig`, `prepublishOnly` を整備
- `.npmignore`: `src/`, `tests/`, `examples/`, 設定ファイル, `CLAUDE.md` をパッケージから除外
- `README.md`: v1.0.0 向けに全 API リファレンスを全面更新（nodes / sync / brief / WebSocket events 追記）
- GitHub Actions `publish.yml`: `v*` タグ push 時に npm publish を自動実行

### Added

- `.github/workflows/publish.yml` — `v*` タグ push トリガーの npm 自動公開 CI

---

## [0.3.0] — 2026-03-14


### Added

#### Agent Roles（エージェントロール対応）
- `cocoro.agent.runWithRole(params)` — ロールを指定してタスクを実行し `TaskHandle` を返す
  - `role`: 実行ロール名 (例: `'lawyer'`, `'researcher'`, `'accountant'`)
  - `instruction`: エージェントへの指示文
  - `outputFormat`: 出力フォーマット指定 (`'markdown'` / `'json'` / `'plain'`)
- 新規型定義: `RunWithRoleParams`, `RoleTaskResult`

#### Nodes API（ノード管理）
- `cocoro.nodes.list()` — 登録済みノード一覧取得 (`GET /nodes`)
- `cocoro.nodes.get(nodeId)` — ノード詳細取得 (`GET /nodes/{id}`)
- `cocoro.nodes.register(params)` — ノード登録 (`POST /nodes/register`)
- `cocoro.nodes.update(nodeId, params)` — ノード情報更新 (`PUT /nodes/{id}`)
- `cocoro.nodes.unregister(nodeId)` — ノード登録解除 (`DELETE /nodes/{id}`)
- `cocoro.nodes.ping(nodeId)` — ノード死活確認 (`POST /nodes/{id}/ping`)
- 新規型定義: `CocoroNode`, `NodeStatus`, `RegisterNodeParams`, `RegisterNodeResult`, `NodeListResponse`

#### Sync Rate API（シンクロ率）
- `cocoro.sync.rate()` — 現在のシンクロ率取得 (`GET /sync/rate`)
- `cocoro.sync.history(days)` — シンクロ率履歴取得 (`GET /sync/history?days=N`)
- 新規型定義: `SyncRate`, `SyncTrend`, `SyncHistory`, `SyncHistoryEntry`

#### Brief API（デイリーブリーフィング）
- `cocoro.brief.daily()` — 本日のブリーフィング取得 (`GET /brief/daily`)
- `cocoro.brief.get(date)` — 指定日のブリーフィング取得 (`GET /brief/{date}`)
- 新規型定義: `DailyBriefing`, `BriefingSection`

#### WebSocket Events（リアルタイムイベント）
- `cocoro.events.connect(path?)` — WebSocket接続を開始し `CocoroEventConnection` を返す
- `CocoroEventConnection` — 型付きイベントエミッター（`.on()` / `.off()` / `.once()` / `.close()`）
- 自動再接続（デフォルト: 3秒後）
- 対応イベント: `task.completed` / `task.failed` / `task.started` / `task.progress` / `emotion.changed` / `memory.updated` / `sync.rate.changed` / `node.online` / `node.offline`
- 新規型定義: `CocoroEventType`, `CocoroEventMap`, `CocoroEvent` と各ペイロード型

---

## [0.2.0] — 2026-03-12


### Added

#### Setup API（Boot Wizard）
- `cocoro.setup.start(mode)` — セットアップセッション開始 (`POST /setup/start`)
- `cocoro.setup.answer(sessionId, questionId, answer)` — 質問への回答 (`POST /setup/answer`)
- `cocoro.setup.result(sessionId)` — 分析結果取得・パーソナリティへ適用 (`GET /setup/result/{id}`)
- `cocoro.setup.progress(sessionId)` — 進捗確認 (`GET /setup/progress/{id}`)
- 新規型定義: `SetupMode`, `SetupSession`, `SetupQuestion`, `SetupAnswerRequest`, `SetupAnswerResult`, `SetupResult`

#### Memory API（エイリアス）
- `cocoro.memory.memoryList(params?)` — `getShortTerm()` のエイリアス
- `cocoro.memory.memorySearch(query, limit?)` — `search()` のエイリアス

#### Emotion API（エイリアス）
- `cocoro.emotion.emotionState()` — `getState()` のエイリアス

---

## [0.1.1] — 2026-03-11

### Fixed

- `ChatResource.send()` — cocoro-core APIレスポンスのフィールド不一致を修正
  - `response` → `text` フォールバック追加
  - `session_id` (snake_case) → `sessionId` (camelCase) 対応
  - `emotion` 文字列 → `EmotionState` オブジェクト変換ロジック追加

---

## [0.1.0] — 2026-03-08

### Added

- **CocoroClient** — `baseUrl` / `agentUrl` / `apiKey` で初期化
- **AuthManager** — JWT自動取得・55分キャッシュ、`HTTP 501` 時のAPIキーフォールバック
- **ChatResource** — `send()` / `stream()` + `ChatStream`（AsyncIterable + `final()`）
- **PersonalityResource** — `get()` / `getGrowth()`
- **EmotionResource** — `getState()`
- **MemoryResource** — `getStats()` / `getShortTerm()` / `search()` / `vectorSearch()` / `deleteEntry()` / `clearShortTerm()` / `clearAll()`
- **AgentResource** — `run()` / `list()` / `get()` / `getOrgStatus()` / `getStats()` + `TaskHandle`パターン
- **MonitorResource** — `getDashboard()`
- **HealthResource** — `check()`（認証不要）
- **HttpClient** — `request()` / `stream()` / `sseGet()`
- **Error classes** — `CocoroError` / `CocoroAuthError` / `CocoroTimeoutError` / `CocoroNetworkError`
- Vitest テスト 19件
- GitHub Actions CI
