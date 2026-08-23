import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assertPermission,
  createAgentContext,
  UnauthorizedAgentActionError,
} from '../../lib/agents/permissions'

test('an agent cannot use a domain tool outside its permission scope', () => {
  const concierge = createAgentContext('concierge', 'guest')
  assert.doesNotThrow(() => assertPermission(concierge, 'catalog:read'))
  assert.throws(
    () => assertPermission(concierge, 'booking:create'),
    UnauthorizedAgentActionError,
  )
  assert.throws(
    () => assertPermission(concierge, 'availability:owner-block'),
    UnauthorizedAgentActionError,
  )
  assert.throws(
    () => assertPermission(concierge, 'exception:resolve'),
    UnauthorizedAgentActionError,
  )
})

test('only the intended agents can mutate availability or resolve exceptions', () => {
  const guardian = createAgentContext('availability-guardian', 'operator')
  assert.doesNotThrow(() => assertPermission(guardian, 'availability:owner-block'))

  const moments = createAgentContext('moments', 'system')
  assert.throws(
    () => assertPermission(moments, 'availability:owner-block'),
    UnauthorizedAgentActionError,
  )

  const exceptionsAgent = createAgentContext('exceptions', 'operator')
  assert.doesNotThrow(() => assertPermission(exceptionsAgent, 'exception:resolve'))

  const propertyIntake = createAgentContext('property-intake', 'system')
  assert.throws(
    () => assertPermission(propertyIntake, 'exception:resolve'),
    UnauthorizedAgentActionError,
  )
})
