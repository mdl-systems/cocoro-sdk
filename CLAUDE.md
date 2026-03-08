# CLAUDE.md — cocoro-sdk

cocoro-core (FastAPI:8001) へのTypeScript SDKです。
cocoro-website と cocoro-apps から使用されます。

## 開発コマンド

```bash
npm install          # 依存パッケージインストール
npm run dev          # watchモードでビルド（tsup --watch）
npm run build        # 本番ビルド (tsup → dist/)
npm test             # Vitest（watch mode）
npm run test:run     # Vitest（1回実行）
npm run type-check   # tsc --noEmit
```

## ディレクトリ構成

```
src/
├── index.ts            ← 全エクスポートのエントリポイント
├── client.ts           ← CocoroClient（起点）
├── auth.ts             ← JWT自動取得・キャッシュ
├── http.ts             ← fetchラッパー（認証・エラー・SSE）
├── errors.ts           ← CocoroError / CocoroAuthError / ...
├── resources/          ← 各APIリソース
│   ├── chat.ts         ← send() / stream() + ChatStream
│   ├── personality.ts
│   ├── emotion.ts
│   ├── memory.ts
│   ├── agent.ts
│   ├── monitor.ts
│   └── health.ts
└── types/              ← TypeScript型定義
    ├── chat.ts
    ├── emotion.ts
    ├── personality.ts
    ├── memory.ts
    ├── agent.ts
    └── common.ts
```

## アーキテクチャ

```
CocoroClient
  ├── AuthManager (auth.ts)  ← JWT取得・キャッシュ（55分有効）
  ├── HttpClient  (http.ts)  ← fetch + 認証ヘッダー付与 + エラーマッピング
  └── Resources (resources/) ← APIエンドポイントごとのクラス
```

## 重要ポイント

- **src/client.ts が起点**。CocoroClient のコンストラクタで全リソースを初期化
- **JWT認証は auth.ts が自動管理**（外部から意識不要）
  - `getToken()` でキャッシュ確認 → 期限切れなら自動更新
  - `invalidate()` で強制リセット（401エラー時に自動呼び出し）
- **SSEストリーミングは chat.ts の `stream()` を使用**
  - `ChatStream` は AsyncIterable + `final()` メソッド付き
  - SSEvento の `data:` フィールドをパースして chunk.text を yield
- **`health.check()` のみ認証不要** (`skipAuth: true`)
- **エラーは必ず src/errors.ts のカスタムクラスを使う**
  - `CocoroAuthError` → 401/403
  - `CocoroTimeoutError` → タイムアウト
  - `CocoroNetworkError` → fetch失敗
  - `CocoroError` → その他のAPIエラー

## cocoro-core エンドポイント変更時

1. `src/types/` の型定義を更新
2. `src/resources/` の該当ファイルのパスを更新
3. `tests/` のモックレスポンスを更新

## cocoro-website での使用例

```typescript
// src/lib/cocoro.ts
import { CocoroClient } from '@mdl-systems/cocoro-sdk'

export const cocoro = new CocoroClient({
  baseUrl: process.env.COCORO_CORE_URL!,
  apiKey: process.env.COCORO_CORE_API_KEY!,
})
```

## 環境変数

```bash
COCORO_CORE_URL=http://192.168.50.92:8001
COCORO_CORE_API_KEY=<your-api-key>
```
