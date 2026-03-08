/**
 * cocoro-agent デモ例
 * Run: npx tsx examples/agent-demo.ts
 */
import { CocoroClient, TaskHandle } from '../src/index.js'

const cocoro = new CocoroClient({
    baseUrl: 'http://localhost:8001',    // cocoro-core
    agentUrl: 'http://localhost:8002',   // cocoro-agent
    apiKey: process.env.COCORO_API_KEY ?? 'cocoro-dev-2026',
})

async function main() {
    // ── 1. エージェント一覧を確認 ──────────────────────────────────────
    console.log('\n📋 エージェント一覧:')
    const agents = await cocoro.agent.list()
    for (const agent of agents) {
        console.log(`  [${agent.status}] ${agent.name} (${agent.department})`)
    }

    // ── 2. 組織状態を確認 ──────────────────────────────────────────────
    console.log('\n🏢 組織状態:')
    const org = await cocoro.agent.getOrgStatus()
    console.log('  部門:', Object.keys(org.departments).join(', '))
    console.log('  タスク:', org.totalTasks)

    // ── 3. タスクを投入してSSEで進捗を受け取る ───────────────────────
    console.log('\n🚀 タスク実行:')
    const task: TaskHandle = await cocoro.agent.run({
        title: 'AIトレンドをリサーチして',
        description: '2026年の主要AIトレンドを3点にまとめてください',
        type: 'research',
        priority: 'normal',
    })
    console.log(`  Task ID: ${task.id}`)
    console.log(`  Status:  ${task.status}`)

    // ── 4. SSEで進捗をリアルタイム受信 ──────────────────────────────
    console.log('\n📡 進捗ストリーミング:')
    for await (const event of task.stream()) {
        if (event.event === 'progress') {
            const bar = '█'.repeat(Math.floor((event.data.progress ?? 0) / 10))
            console.log(`  [${bar.padEnd(10)}] ${event.data.progress}% — ${event.data.step}`)
        }
        if (event.event === 'completed') {
            console.log('\n✅ 完了!')
            console.log('  結果:', JSON.stringify(event.data.result, null, 2))
            break
        }
        if (event.event === 'failed') {
            console.error('\n❌ 失敗:', event.data.error)
            break
        }
    }

    // ── 5. 最終結果を取得 ────────────────────────────────────────────
    const result = await task.result()
    console.log('\n📄 最終結果:')
    console.log(`  Duration: ${result.duration}s`)
    console.log(`  Result:   ${JSON.stringify(result.result)}`)

    // ── 6. タスク統計 ────────────────────────────────────────────────
    console.log('\n📊 タスク統計:')
    const stats = await cocoro.agent.getStats()
    console.log(`  Total: ${stats.total}`)
    console.log('  By Status:', stats.byStatus)
    console.log('  By Agent:', stats.byAgent)
}

main().catch(console.error)
