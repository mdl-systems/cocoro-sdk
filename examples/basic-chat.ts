// ============================================================
// basic-chat.ts — シンプルなチャット例
// ============================================================
//
// 実行方法:
//   npx tsx examples/basic-chat.ts
//
// 必須環境変数:
//   COCORO_API_KEY=<your-key>
//   COCORO_CORE_URL=http://192.168.50.92:8001  (省略時にデフォルト使用)

import { CocoroClient, CocoroError, CocoroAuthError } from '../src/index.js'

const cocoro = new CocoroClient({
    baseUrl: process.env.COCORO_CORE_URL ?? 'http://192.168.50.92:8001',
    apiKey: process.env.COCORO_API_KEY ?? '',
})

async function main() {
    // ヘルスチェック
    console.log('🔍 cocoro-core への接続確認中...')
    try {
        const health = await cocoro.health.check()
        console.log(`✅ 接続OK: status=${health.status}, version=${health.version}`)
    } catch (err) {
        console.warn('⚠️  ヘルスチェック失敗（続行します）:', (err as Error).message)
    }

    // チャット送信
    console.log('\n💬 チャット送信中...')
    try {
        const res = await cocoro.chat.send({ message: 'こんにちは！今日の調子はどう？' })

        console.log(`\n📝 レスポンス:`)
        console.log(`   テキスト: ${res.text}`)
        console.log(`   アクション: ${res.action}`)
        console.log(`   感情: ${res.emotion.dominant} (happiness=${res.emotion.happiness.toFixed(2)})`)
        console.log(`   セッションID: ${res.sessionId}`)
    } catch (err) {
        if (err instanceof CocoroAuthError) {
            console.error('❌ 認証エラー: COCORO_API_KEY を確認してください')
        } else if (err instanceof CocoroError) {
            console.error(`❌ APIエラー (${err.status}): ${err.message}`)
        } else {
            throw err
        }
    }
}

main()
