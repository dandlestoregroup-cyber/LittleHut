import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/ops/guard'
import { apiError } from '@/lib/stayza/http'
import { resolveException } from '@/lib/agents/exceptions'
import { createAgentContext } from '@/lib/agents/permissions'

export const dynamic = 'force-dynamic'

const resolveSchema = z.object({
  notes: z.string().trim().max(500).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const guard = requireOperator(request)
  if ('response' in guard) return guard.response

  try {
    const { reference } = await params
    const input = resolveSchema.parse(await request.json().catch(() => ({})))

    // resolveException itself refuses any context that is not an operator.
    const resolved = await resolveException(
      createAgentContext('exceptions', 'operator', guard.session.actorId),
      reference,
      { notes: input.notes },
    )

    return NextResponse.json({ exception: resolved })
  } catch (error) {
    return apiError(error)
  }
}
