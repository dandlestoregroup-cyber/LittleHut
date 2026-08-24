import { NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, clientIdentity } from '@/lib/stayza/http'
import { enforceRateLimit } from '@/lib/stayza/service'
import {
  createSessionToken,
  operatorAuthConfigured,
  operatorSessionCookie,
  operatorSessionFromRequest,
  verifyAccessKey,
} from '@/lib/ops/session'

export const dynamic = 'force-dynamic'

const signInSchema = z.object({
  accessKey: z.string().min(1).max(400),
  actorId: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  try {
    if (!operatorAuthConfigured()) {
      return NextResponse.json(
        {
          error:
            'Operator access is not configured on this deployment. Set OPS_ACCESS_KEY.',
          code: 'ops_not_configured',
        },
        { status: 503 },
      )
    }

    const input = signInSchema.parse(await request.json())
    // Rate limit sign-in attempts by client identity to blunt key guessing.
    await enforceRateLimit('booking', `ops-signin:${clientIdentity(request)}`, 10)

    if (!verifyAccessKey(input.accessKey)) {
      return NextResponse.json(
        { error: 'That access key was not recognised.', code: 'ops_bad_key' },
        { status: 401 },
      )
    }

    const token = createSessionToken(input.actorId)
    const response = NextResponse.json({ signedIn: true })
    response.cookies.set(operatorSessionCookie.name, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: operatorSessionCookie.maxAgeSeconds,
    })
    return response
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: Request) {
  const session = operatorSessionFromRequest(request)
  return NextResponse.json({
    configured: operatorAuthConfigured(),
    signedIn: Boolean(session),
    actorId: session?.actorId ?? null,
  })
}

export async function DELETE() {
  const response = NextResponse.json({ signedIn: false })
  response.cookies.set(operatorSessionCookie.name, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
