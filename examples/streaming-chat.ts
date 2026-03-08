// ============================================================
// streaming-chat.ts — SSEストリーミング例
// ============================================================
//
// 実行方法:
//   npx tsx examples/streaming-chat.ts
//
// 必須環境変数:
//   COCORO_API_KEY=<your-key>
//   COCORO_CORE_URL=http://192.168.50.92:8001

import { CocoroClient, CocoroError } from '../src/index.js'

const cocoro = new CocoroClient({
    baseUrl: process.env.COCORO_CORE_URL ?? 'http://192.168.50.92:8001',
    apiKey: process.env.COCORO_API_KEY ?? '',
})

async function main() {
    console.log('🌊 SSEストリーミング開始...\n')
    console.log('---')
    process.stdout.write('Cocoro: ')

    try {
        const stream = await cocoro.chat.stream({
            message: 'AIと人間の未来について、あなたの考えを聞かせて',
        })

        for await (const chunk of stream) {
            process.stdout.write(chunk.text)
        }

        // ストリーム完了後のメタ情報
        const meta = await stream.final()
        console.log('\n---')
        if (meta) {
            console.log(`\n📊 完了メタ情報:`)
            console.log(`   アクション: ${meta.action}`)
            console.log(`   感情: ${meta.emotion.dominant}`)
            console.log(`   セッションID: ${meta.sessionId}`)
        }
    } catch (err) {
        if (err instanceof CocoroError) {
            console.error(`\n❌ エラー (${err.status}): ${err.message}`)
        } else {
            throw err
        }
    }
}

main()
