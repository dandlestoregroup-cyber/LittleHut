import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import { createException } from './exceptions'
import type { AgentContext } from './types'
import type { BookingRecord, StayProperty } from '../stayza/types'

export interface ConciergeAnswer {
  answered: boolean
  answer?: string
  escalate: boolean
  escalationReason?: string
}

const COMPLAINT_KEYWORDS = [
  'broken',
  'complaint',
  'unsafe',
  'emergency',
  'leak',
  'not working',
  'refund',
  'injur',
]

type Topic = 'location' | 'capacity' | 'stay_dates' | 'features' | 'booking_status'

function matchTopic(question: string): Topic | null {
  const q = question.toLowerCase()
  if (/(where|address|location|direction)/.test(q)) return 'location'
  if (/(how many guests|capacity|sleep)/.test(q)) return 'capacity'
  if (/(check.?in|check.?out|arrival)/.test(q)) return 'stay_dates'
  if (/(feature|amenit|what.*(is|does).*have)/.test(q)) return 'features'
  if (/(status|confirmed|reference)/.test(q)) return 'booking_status'
  return null
}

/**
 * Concierge Agent. It answers only from verified property/booking fields
 * that are passed in — never from invented knowledge. Anything outside that,
 * or anything resembling a complaint or safety issue, is escalated.
 */
export async function answer(
  context: AgentContext,
  input: { question: string; property?: StayProperty; booking?: BookingRecord },
): Promise<ConciergeAnswer> {
  assertPermission(context, 'catalog:read')

  const lower = input.question.toLowerCase()
  if (COMPLAINT_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    await createException(context, {
      category: 'guest_complaint',
      summary: 'Guest raised a complaint or safety/operational concern.',
      reason: input.question,
      evidence: [],
      recommendedAction: 'Operator to contact the guest directly.',
      responsibleRole: 'operator',
      priority: 'urgent',
    })
    await recordAudit(context, {
      trigger: 'concierge:answer',
      decision: 'Escalated a complaint or safety concern.',
      action: 'concierge:escalate',
      result: 'escalated',
    })
    return {
      answered: false,
      escalate: true,
      escalationReason:
        'Guest raised a complaint or safety concern; a human must respond.',
    }
  }

  const topic = matchTopic(input.question)
  let answerText: string | undefined

  if (topic === 'location' && input.property) {
    answerText = `${input.property.name} is located in ${input.property.location}.`
  }
  if (topic === 'capacity' && input.property) {
    answerText = `${input.property.name} accommodates up to ${input.property.maxGuests} guests.`
  }
  if (topic === 'features' && input.property) {
    answerText = input.property.features.join(', ')
  }
  if (topic === 'stay_dates' && input.booking) {
    answerText = `Your check-in is ${input.booking.checkIn} and check-out is ${input.booking.checkOut}.`
  }
  if (topic === 'booking_status' && input.booking) {
    answerText = `Booking ${input.booking.reference} is currently ${input.booking.status}.`
  }

  if (!answerText) {
    await recordAudit(context, {
      trigger: 'concierge:answer',
      decision: 'No verified data available to answer this question.',
      action: 'concierge:escalate',
      result: 'escalated',
    })
    return {
      answered: false,
      escalate: true,
      escalationReason: 'This is outside verified property or booking information.',
    }
  }

  await recordAudit(context, {
    trigger: 'concierge:answer',
    decision: `Answered from verified property/booking fields (${topic}).`,
    action: 'concierge:answer',
    result: 'success',
  })
  return { answered: true, answer: answerText, escalate: false }
}
