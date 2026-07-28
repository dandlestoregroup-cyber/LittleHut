import { NextResponse } from 'next/server'
import { apiError, clientIdentity } from '@/lib/stayza/http'
import {
  createOwnerApplication,
  enforceRateLimit,
} from '@/lib/stayza/service'
import { ownerApplicationSchema } from '@/lib/stayza/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const input = ownerApplicationSchema.parse(await request.json())
    await enforceRateLimit('owner-application', clientIdentity(request), 3)
    const { consent: _consent, website: _website, ...applicationInput } = input
    const application = await createOwnerApplication(applicationInput)
    return NextResponse.json(
      {
        application: {
          reference: application.reference,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    return apiError(error)
  }
}
