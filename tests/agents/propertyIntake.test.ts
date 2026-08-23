import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAgentContext } from '../../lib/agents/permissions'
import { processIntake } from '../../lib/agents/propertyIntake'
import { setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

test('property intake populates only known fields and never invents missing facts', async () => {
  const context = createAgentContext('property-intake', 'system')
  const result = await processIntake(context, {
    ownerName: ' Sara Youssef ',
    email: 'Sara@Example.com',
    propertyName: 'Marina View Chalet',
    bedrooms: '3',
  })

  assert.equal(result.normalized.ownerName, 'Sara Youssef')
  assert.equal(result.normalized.email, 'sara@example.com')
  assert.equal(result.normalized.propertyName, 'Marina View Chalet')
  assert.equal(result.normalized.bedrooms, 3)

  // Fields never supplied must never appear, invented or defaulted.
  assert.equal('maxGuests' in result.normalized, false)
  assert.equal('phone' in result.normalized, false)
  assert.equal('location' in result.normalized, false)
  assert.equal('operationNotes' in result.normalized, false)

  assert.deepEqual(
    [...result.missingFields].sort(),
    ['location', 'maxGuests', 'operationNotes', 'phone', 'propertyType'].sort(),
  )
  assert.equal(result.readyForApplication, false)
})

test('property intake flags contradictions instead of guessing a resolution', async () => {
  const context = createAgentContext('property-intake', 'system')
  const result = await processIntake(context, {
    ownerName: 'Test Owner',
    email: 'owner@example.com',
    phone: '+20 100 000 0000',
    propertyName: 'Test Villa',
    location: 'Azha',
    propertyType: 'castle',
    bedrooms: 5,
    maxGuests: 2,
    operationNotes: 'Local operating team handles cleaning and access.',
  })

  assert.equal('propertyType' in result.normalized, false)
  assert.ok(result.contradictions.some((c) => c.includes('property type')))
  assert.ok(result.contradictions.some((c) => c.includes('capacity')))
  assert.equal(result.readyForApplication, false)
})
