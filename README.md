# @mdl-systems/cocoro-sdk

> TypeScript SDK for [cocoro-core](https://github.com/mdl-systems/cocoro-core) — Personality AI Operating System

[![npm version](https://img.shields.io/badge/version-0.2.0-purple)](https://github.com/mdl-systems/cocoro-sdk)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## Overview

`@mdl-systems/cocoro-sdk` is the official TypeScript/JavaScript SDK for interacting with **cocoro-core** (port 8001) and **cocoro-agent** (port 8002).  
It provides type-safe wrappers for Chat, Personality, Memory, Emotion, Setup (Boot Wizard), Agents, and Monitoring.

```
cocoro-core :8001  ←  CocoroClient (chat, personality, memory, emotion, setup, monitor)
cocoro-agent :8002 ←  CocoroClient (agent — TaskHandle pattern)
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
  baseUrl: 'http://192.168.50.92:8001',  // cocoro-core
  apiKey:  process.env.COCORO_API_KEY!,
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

### Setup（Boot Wizard） — v0.2.0

初回セットアップ（パーソナリティ構築）のAPIです。

```typescript
// 1. セットアップセッションを開始
const session = await cocoro.setup.start('boot')
// session.sessionId     — 以降の呼び出しに使うID
// session.firstQuestion — 最初の質問

// 2. 質問に回答
const next = await cocoro.setup.answer(
  session.sessionId,
  session.firstQuestion.questionId,
  '私はエンジニアです',
)
// next.nextQuestion — 次の質問（null = 完了）
// next.completed    — true なら全質問終了
// next.progress     — 0.0 〜 1.0

// 3. 分析結果を取得・パーソナリティへ適用
const result = await cocoro.setup.result(session.sessionId)
console.log(result.status)   // 'completed' | 'analyzing' | 'failed'
console.log(result.summary)  // 適用されたパーソナリティの概要

// 4. 進捗確認
const progress = await cocoro.setup.progress(session.sessionId)
```

| メソッド | エンドポイント |
|---------|--------------|
| `setup.start(mode)` | `POST /setup/start` |
| `setup.answer(sessionId, questionId, answer)` | `POST /setup/answer` |
| `setup.result(sessionId)` | `GET /setup/result/{id}` |
| `setup.progress(sessionId)` | `GET /setup/progress/{id}` |

---

### Memory — v0.2.0

```typescript
// 短期記憶（最近の会話）を取得
const memories = await cocoro.memory.memoryList()
const memories = await cocoro.memory.memoryList({ limit: 20 })

// テキスト検索
const results = await cocoro.memory.memorySearch('仕事の優先度')
const results = await cocoro.memory.memorySearch('旅行', 5)  // limit指定

// ベクトル類似検索
const results = await cocoro.memory.vectorSearch({ query: '感情について', limit: 3 })

// 統計
const stats = await cocoro.memory.getStats()
console.log(stats.longTermCount)  // 長期記憶の件数

// 削除
await cocoro.memory.deleteEntry('entry-id-xxxx')
await cocoro.memory.clearShortTerm()
await cocoro.memory.clearAll()  // ⚠️ 全削除（元に戻せません）
```

---

### Emotion — v0.2.0

```typescript
// 現在の感情状態を取得
const state = await cocoro.emotion.emotionState()
// または
const state = await cocoro.emotion.getState()

console.log(state.dominant)   // 最も強い感情: 'happiness' | 'sadness' | 'surprise' | ...
console.log(state.happiness)  // 0.0 〜 1.0
console.log(state.trust)      // 0.0 〜 1.0
```

---

### Personality

```typescript
const profile = await cocoro.personality.get()
console.log(profile.identity.name)    // 'Cocoro'
console.log(profile.values.empathy)   // 0.0 〜 1.0

const growth = await cocoro.personality.getGrowth()
console.log(growth.syncRate)  // シンクロ率（%）
console.log(growth.phase)     // 'initial' | 'accelerating' | 'stable'
```

---

### Agent（cocoro-agent: 8002）

```typescript
const cocoro = new CocoroClient({
  baseUrl:  'http://192.168.50.92:8001',
  agentUrl: 'http://192.168.50.92:8002',  // cocoro-agent
  apiKey:   process.env.COCORO_API_KEY!,
})

// タスク投入
const task = await cocoro.agent.run({
  title: 'AIトレンドをリサーチして',
  type: 'research',
})

// SSEで進捗をリアルタイム受信
for await (const event of task.stream()) {
  if (event.event === 'progress')   console.log(event.data.step, event.data.progress + '%')
  if (event.event === 'completed')  break
}

// 最終結果
const result = await task.result()
console.log(result.result)

// 統計・一覧
const stats  = await cocoro.agent.getStats()
const agents = await cocoro.agent.list()
const org    = await cocoro.agent.getOrgStatus()
```

---

### Health & Monitor

```typescript
const health = await cocoro.health.check()
console.log(health.status)   // 'ok'
console.log(health.version)  // '1.0.0'

const dashboard = await cocoro.monitor.getDashboard()
```

---

## Authentication

`cocoro-core` の `/auth/token` に API キーを送信して JWT を自動取得・キャッシュします。  
JWT 未設定時（`HTTP 501`）は API キーを Bearer トークンとして自動フォールバックします。

```typescript
// 環境変数で管理を推奨
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

# 接続確認
npx tsx examples/basic-chat.ts
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md)