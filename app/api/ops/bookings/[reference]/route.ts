import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/ops/guard'
import { apiError } from '@/lib/stayza/http'
import { assertNoSecretFields, operatorBookingView } from '@/lib/stayza/access'
import { getBookingForOperator, setBookingStatus } from '@/lib/stayza/service'
import { recordAudit } from '@/lib/agents/audit'
import { createAgentContext } from '@/lib/agents/permissions'

export const dynamic = 'force-dynamic'

const decisionSchema = z.object({
  status: z.enum(['confirmed', 'declined', 'cancelled']),
  note: z.string().trim().max(500).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const guard = requireOperator(request)
  if ('response' in guard) return guard.response

  try {
    const { reference } = await params
    const input = decisionSchema.parse(await request.json())

    const existing = await getBookingForOperator(reference)
    if (!existing) {
      return NextResponse.json(
        { error: 'No booking matched that reference.', code: 'booking_not_found' },
        { status: 404 },
      )
    }

    const updated = await setBookingStatus(reference, input.status)

    // Every operator decision on a booking is written to the same audit trail
    // agent actions use, with the human actor recorded as the approver.
    await recordAudit(
      createAgentContext('booking', 'operator', guard.session.actorId),
      {
        trigger: 'ops:booking-decision',
        decision: `Operator set ${updated.reference} to ${input.status}.`,
        action: 'booking:set-status',
        result: 'success',
        humanApprovalIfAny: guard.session.actorId,
        details: { reference: updated.reference, note: input.note },
      },
    ).catch(() => undefined)

    const payload = { booking: operatorBookingView(updated) }
    assertNoSecretFields(payload, 'ops booking decision')
    return NextResponse.json(payload)
  } catch (error) {
    return apiError(error)
  }
}
