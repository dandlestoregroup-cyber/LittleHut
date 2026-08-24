import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/ops/guard'
import { apiError } from '@/lib/stayza/http'
import { setOwnerApplicationStatus } from '@/lib/stayza/service'
import { recordAudit } from '@/lib/agents/audit'
import { createAgentContext } from '@/lib/agents/permissions'

export const dynamic = 'force-dynamic'

const decisionSchema = z.object({
  status: z.enum(['submitted', 'reviewing', 'approved', 'declined']),
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
    const updated = await setOwnerApplicationStatus(reference, input.status)

    await recordAudit(
      createAgentContext('scout-qualification', 'operator', guard.session.actorId),
      {
        trigger: 'ops:owner-application-decision',
        decision: `Operator set ${updated.reference} to ${input.status}.`,
        action: 'owner-application:set-status',
        result: 'success',
        humanApprovalIfAny: guard.session.actorId,
      },
    ).catch(() => undefined)

    return NextResponse.json({ application: updated })
  } catch (error) {
    return apiError(error)
  }
}
