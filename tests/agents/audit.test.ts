import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as momentsAgent from '../../lib/agents/momentsAgent'
import { listAudit } from '../../lib/agents/audit'
import { createAgentContext } from '../../lib/agents/permissions'
import { setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

test('agent actions generate audit records with agent, decision, action, result and timestamp', async () => {
  const context = createAgentContext('moments', 'system')
  await momentsAgent.nextBestAction(context, { role: 'guest', phase: 'browsing' })

  const entries = await listAudit(createAgentContext('mastermind', 'system'))
  const entry = entries.find(
    (candidate) =>
      candidate.agent === 'moments' && candidate.trigger === 'moments:guest:browsing',
  )
  assert.ok(entry, 'expected an audit entry for the moments recommendation')
  assert.equal(entry?.result, 'success')
  assert.ok(entry?.decision.length && entry.decision.length > 0)
  assert.ok(entry?.timestamp)
})
