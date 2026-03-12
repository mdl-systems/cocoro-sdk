# Changelog

All notable changes to `@mdl-systems/cocoro-sdk` are documented here.

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
