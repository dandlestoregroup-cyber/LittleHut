import { NextResponse } from 'next/server'
import { requireOperator } from '@/lib/ops/guard'
import { apiError } from '@/lib/stayza/http'
import {
  assertNoSecretFields,
  operatorBookingView,
  operatorOwnerApplicationView,
  operatorPropertyView,
} from '@/lib/stayza/access'
import { properties } from '@/lib/stayza/catalog'
import { listBookings, listOwnerApplications } from '@/lib/stayza/service'
import { listExceptions } from '@/lib/agents/exceptions'
import { createAgentContext } from '@/lib/agents/permissions'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const guard = requireOperator(request)
  if ('response' in guard) return guard.response

  try {
    const [bookings, applications] = await Promise.all([
      listBookings(),
      listOwnerApplications(),
    ])

    // The exceptions queue is agent-layer data; read it through the agent
    // permission matrix rather than reaching into storage directly.
    const exceptions = await listExceptions(
      createAgentContext('exceptions', 'operator', guard.session.actorId),
    ).catch(() => [])

    const payload = {
      actorId: guard.session.actorId,
      counts: {
        bookingsPending: bookings.filter((b) => b.status === 'requested').length,
        bookingsConfirmed: bookings.filter((b) => b.status === 'confirmed').length,
        applicationsOpen: applications.filter(
          (a) => a.status === 'submitted' || a.status === 'reviewing',
        ).length,
        exceptionsOpen: exceptions.filter((e) => e.resolutionState === 'open')
          .length,
      },
      bookings: bookings.map(operatorBookingView),
      ownerApplications: applications.map(operatorOwnerApplicationView),
      exceptions,
      properties: properties.map(operatorPropertyView),
    }

    assertNoSecretFields(payload, 'ops overview')
    return NextResponse.json(payload)
  } catch (error) {
    return apiError(error)
  }
}
