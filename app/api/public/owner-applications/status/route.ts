import { NextResponse } from 'next/server'
import { apiError, clientIdentity } from '@/lib/stayza/http'
import { enforceRateLimit, getOwnerApplicationStatus } from '@/lib/stayza/service'
import { bookingStatusSchema } from '@/lib/stayza/validation'
import {
  assertNoSecretFields,
  ownerApplicationStatusView,
} from '@/lib/stayza/access'

export const dynamic = 'force-dynamic'

/**
 * Owner self-service status lookup. Requires the reference AND the email the
 * application was submitted with — the same two-factor pattern the guest
 * booking tracker uses, so one owner can never read another's submission.
 */
export async function POST(request: Request) {
  try {
    const input = bookingStatusSchema.parse(await request.json())
    await enforceRateLimit(
      'owner-application',
      `status:${clientIdentity(request)}`,
      20,
    )

    const application = await getOwnerApplicationStatus(
      input.reference,
      input.email,
    )
    if (!application) {
      return NextResponse.json(
        {
          error: 'No application matched that reference and email.',
          code: 'application_not_found',
        },
        { status: 404 },
      )
    }

    const payload = { application: ownerApplicationStatusView(application) }
    assertNoSecretFields(payload, 'owner application status')
    return NextResponse.json(payload)
  } catch (error) {
    return apiError(error)
  }
}
