import { NextResponse } from 'next/server'
import { apiError } from '@/lib/stayza/http'
import { getAvailability } from '@/lib/stayza/service'
import { quoteSchema } from '@/lib/stayza/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const input = quoteSchema.parse(await request.json())
    return NextResponse.json(await getAvailability(input))
  } catch (error) {
    return apiError(error)
  }
}
