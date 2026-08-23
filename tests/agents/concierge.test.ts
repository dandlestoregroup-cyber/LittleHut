import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as concierge from '../../lib/agents/concierge'
import { createAgentContext } from '../../lib/agents/permissions'
import { listExceptions } from '../../lib/agents/exceptions'
import { properties } from '../../lib/stayza/catalog'
import { setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

test('concierge answers only from verified property fields', async () => {
  const context = createAgentContext('concierge', 'guest')
  const result = await concierge.answer(context, {
    question: 'How many guests can this villa host?',
    property: properties[0],
  })
  assert.equal(result.answered, true)
  assert.match(result.answer ?? '', /8 guests/)
  assert.equal(result.escalate, false)
})

test('concierge escalates rather than inventing unknown information', async () => {
  const context = createAgentContext('concierge', 'guest')
  const result = await concierge.answer(context, {
    question: 'What is the wifi password?',
    property: properties[0],
  })
  assert.equal(result.answered, false)
  assert.equal(result.escalate, true)
})

test('concierge escalates a complaint and opens an exception', async () => {
  const context = createAgentContext('concierge', 'guest')
  const result = await concierge.answer(context, {
    question: 'The air conditioning is broken and it feels unsafe.',
    property: properties[0],
  })
  assert.equal(result.escalate, true)

  const exceptions = await listExceptions(createAgentContext('exceptions', 'operator'))
  assert.ok(exceptions.some((exception) => exception.category === 'guest_complaint'))
})
