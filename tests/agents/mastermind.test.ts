import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import * as mastermind from '../../lib/agents/mastermind'
import { createAgentContext } from '../../lib/agents/permissions'
import { setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

afterEach(() => {
  delete process.env.AGENTS_ENABLED
})

test('mastermind routes with a context permitted to write the moments audit', async () => {
  // Regression test: route() previously forwarded the caller's own context
  // (e.g. the mastermind agent's context, which only has audit:read and
  // exception:read) straight into the Moments agent, which requires
  // audit:write — so every enabled-path call threw.
  const context = createAgentContext('mastermind', 'system')
  const action = await mastermind.route(context, { role: 'guest', phase: 'browsing' })
  assert.equal(action.action, 'recommend')
})
