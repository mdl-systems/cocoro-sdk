# @mdl-systems/cocoro-sdk

> TypeScript SDK for [cocoro-core](https://github.com/mdl-systems/cocoro-core) — Personality AI Operating System

[![npm version](https://img.shields.io/npm/v/@mdl-systems/cocoro-sdk?color=purple)](https://www.npmjs.com/package/@mdl-systems/cocoro-sdk)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

## Overview

`@mdl-systems/cocoro-sdk` is the official TypeScript/JavaScript SDK for interacting with **cocoro-core** (port 8001) and **cocoro-agent** (port 8002).

```
cocoro-core  :8001  ←  chat, personality, memory, emotion, setup, sync, brief, nodes, monitor
cocoro-agent :8002  ←  agent tasks (TaskHandle pattern), runWithRole
cocoro-core  :8001  ←  WebSocket events (task.*, emotion.changed, sync.rate.changed, node.*)
```

---

## Installation

```bash
npm install @mdl-systems/cocoro-sdk
```

---

## Quick Start

```typescript
import { CocoroClient } from '@mdl-systems/cocoro-sdk'

const cocoro = new CocoroClient({
  baseUrl:  'http://192.168.50.92:8001',  // cocoro-core
  agentUrl: 'http://192.168.50.92:8002',  // cocoro-agent (optional)
  apiKey:   process.env.COCORO_API_KEY!,
})

// Chat
const res = await cocoro.chat.send({ message: 'こんにちは！' })
console.log(res.text)
console.log(res.emotion.dominant)  // 'happiness' | 'surprise' | ...
```

---

## API Reference

### Chat

```typescript
// 通常チャット（一括レスポンス）
const res = await cocoro.chat.send({ message: 'こんにちは' })
console.log(res.text)       // AIの返答
console.log(res.action)     // 'chat' | 'task' | ...
console.log(res.sessionId)  // セッションID

// SSEストリーミング
const stream = await cocoro.chat.stream({ message: 'こんにちは' })
for await (const chunk of stream) {
  process.stdout.write(chunk.text)
}
const meta = await stream.final()  // emotion / action など
```

---

### Agent（cocoro-agent: 8002）

```typescript
// 通常タスク投入
const task = await cocoro.agent.run({
  title: 'AIトレンドをリサーチして',
  type: 'research',
})

// ロール指定タスク（v1.0.0）
const task = await cocoro.agent.runWithRole({
  role: 'lawyer',
  instruction: 'この契約書を分析して',
  outputFormat: 'markdown',
})

// SSEで進捗をリアルタイム受信
for await (const event of task.stream()) {
  if (event.event === 'progress')  console.log(event.data.step, event.data.progress + '%')
  if (event.event === 'completed') break
}

// 最終結果
const result = await task.result()
console.log(result.result)

// 統計・一覧・組織状態
const stats  = await cocoro.agent.getStats()
const agents = await cocoro.agent.list()
const org    = await cocoro.agent.getOrgStatus()
```

| SDKメソッド | エンドポイント |
|------------|-------------|
| `agent.run(params)` | `POST /tasks` |
| `agent.runWithRole(params)` | `POST /tasks` (ロール指定) |
| `agent.list()` | `GET /agents` |
| `agent.getOrgStatus()` | `GET /org/status` |
| `agent.getStats()` | `GET /stats` |
| `task.stream()` | `GET /tasks/{id}/stream` (SSE) |
| `task.result()` | `GET /tasks/{id}/result` |

---

### Nodes（ノード管理） — v1.0.0

```typescript
// ノード一覧
const nodes = await cocoro.nodes.list()
nodes.forEach(n => console.log(`${n.nodeId}: ${n.status}`))

// ノード登録
await cocoro.nodes.register({
  nodeId: 'minipc-b',
  ip: '192.168.50.93',
  roles: ['lawyer'],
})

// ノード詳細・更新・削除・死活確認
const node = await cocoro.nodes.get('minipc-b')
await cocoro.nodes.update('minipc-b', { roles: ['lawyer', 'accountant'] })
await cocoro.nodes.unregister('minipc-b')
const { alive } = await cocoro.nodes.ping('minipc-b')
```

---

### Sync Rate（シンクロ率） — v1.0.0

```typescript
// 現在のシンクロ率
const sync = await cocoro.sync.rate()
console.log(sync.rate)   // 73.5
console.log(sync.trend)  // 'up' | 'down' | 'stable'
console.log(sync.delta)  // 2.3（前回比）

// 履歴（過去30日）
const history = await cocoro.sync.history(30)
history.entries.forEach(e => console.log(`${e.date}: ${e.rate}%`))
console.log(`平均シンクロ率: ${history.averageRate}%`)
```

---

### Brief（デイリーブリーフィング） — v1.0.0

```typescript
// 本日のブリーフィング
const brief = await cocoro.brief.daily()
console.log(brief.summary)
brief.recommendations?.forEach(r => console.log('- ' + r))

// 指定日のブリーフィング
const brief = await cocoro.brief.get('2026-03-14')
```

---

### WebSocket Events（リアルタイムイベント） — v1.0.0

```typescript
// 接続
const ws = await cocoro.events.connect()

// イベント受信（型付き）
ws.on('task.completed', (event) => {
  console.log('タスク完了:', event.title, `(${event.duration}ms)`)
})

ws.on('emotion.changed', (event) => {
  console.log('感情変化:', event.dominant, `(強度: ${event.intensity})`)
})

ws.on('sync.rate.changed', (event) => {
  console.log(`シンクロ率: ${event.previous}% → ${event.rate}%`)
})

ws.on('node.online', (event) => {
  console.log(`ノード接続: ${event.nodeId} (${event.ip})`)
})

// 1回限りのハンドラー
ws.once('task.completed', (event) => console.log('最初の完了:', event.title))

// ハンドラー解除
ws.off('emotion.changed', handler)

// 接続を閉じる
ws.close()
```

**対応イベント一覧:**

| イベント | ペイロード |
|---------|-----------|
| `task.completed` | `{ taskId, title, duration, result }` |
| `task.failed` | `{ taskId, title, error }` |
| `task.started` | `{ taskId, title }` |
| `task.progress` | `{ taskId, title, step, progress }` |
| `emotion.changed` | `{ dominant, previous, intensity, vector }` |
| `memory.updated` | `{ type, count, latestSummary }` |
| `sync.rate.changed` | `{ rate, previous, delta, trend }` |
| `node.online` | `{ nodeId, ip, status }` |
| `node.offline` | `{ nodeId, ip, status }` |

---

### Setup（Boot Wizard）

```typescript
// 1. セットアップセッションを開始
const session = await cocoro.setup.start('boot')

// 2. 質問に回答
const next = await cocoro.setup.answer(
  session.sessionId,
  session.firstQuestion.questionId,
  '私はエンジニアです',
)
// next.nextQuestion — 次の質問（null = 完了）
// next.completed    — true なら全質問終了

// 3. 分析結果を取得・パーソナリティへ適用
const result = await cocoro.setup.result(session.sessionId)
console.log(result.status)   // 'completed' | 'analyzing' | 'failed'
console.log(result.summary)

// 4. 進捗確認
const progress = await cocoro.setup.progress(session.sessionId)
```

---

### Memory

```typescript
// 短期記憶（最近の会話）を取得
const memories = await cocoro.memory.memoryList({ limit: 20 })

// テキスト検索
const results = await cocoro.memory.memorySearch('仕事の優先度', 5)

// ベクトル類似検索
const results = await cocoro.memory.vectorSearch({ query: '感情について', limit: 3 })

// 統計・削除
const stats = await cocoro.memory.getStats()
await cocoro.memory.deleteEntry('entry-id-xxxx')
await cocoro.memory.clearShortTerm()
await cocoro.memory.clearAll()  // ⚠️ 全削除（元に戻せません）
```

---

### Emotion

```typescript
const state = await cocoro.emotion.getState()
console.log(state.dominant)   // 'happiness' | 'sadness' | 'surprise' | ...
console.log(state.happiness)  // 0.0 〜 1.0
console.log(state.trust)      // 0.0 〜 1.0
```

---

### Personality

```typescript
const profile = await cocoro.personality.get()
console.log(profile.identity.name)   // 'Cocoro'
console.log(profile.values.empathy)  // 0.0 〜 1.0

const growth = await cocoro.personality.getGrowth()
console.log(growth.syncRate)  // シンクロ率（%）
console.log(growth.phase)     // 'initial' | 'accelerating' | 'stable'
```

---

### Health & Monitor

```typescript
const health = await cocoro.health.check()
console.log(health.status)   // 'ok'

const dashboard = await cocoro.monitor.getDashboard()
console.log(dashboard.cpu)    // CPU使用率 (0-100)
console.log(dashboard.memory) // メモリ使用率 (0-100)
```

---

## Authentication

`cocoro-core` の `/auth/token` に API キーを送信して JWT を自動取得・55分キャッシュします。  
JWT 未設定時（`HTTP 501`）は API キーを Bearer トークンとして自動フォールバックします。

```typescript
const cocoro = new CocoroClient({
  baseUrl: process.env.COCORO_CORE_URL!,
  apiKey:  process.env.COCORO_API_KEY!,
})
```

---

## Error Handling

```typescript
import { CocoroClient, CocoroAuthError, CocoroError, CocoroNetworkError } from '@mdl-systems/cocoro-sdk'

try {
  const res = await cocoro.chat.send({ message: 'hello' })
} catch (err) {
  if (err instanceof CocoroAuthError)    console.error('認証エラー: APIキーを確認してください')
  if (err instanceof CocoroError)        console.error(`APIエラー (${err.status}): ${err.message}`)
  if (err instanceof CocoroNetworkError) console.error('接続エラー: cocoro-coreが起動しているか確認')
}
```

---

## Environment Variables

```bash
COCORO_CORE_URL=http://192.168.50.92:8001   # cocoro-core (必須)
COCORO_AGENT_URL=http://192.168.50.92:8002  # cocoro-agent (エージェント機能使用時)
COCORO_API_KEY=cocoro-xxxx                  # APIキー (必須)
```

---

## Development

```bash
npm install
npm run build       # 本番ビルド → dist/
npm run dev         # watchモード
npm run test:run    # Vitest（1回実行）
npm run type-check  # 型チェック

# デモ実行（cocoro-agent起動中に）
npx tsx examples/agent-demo.ts
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)