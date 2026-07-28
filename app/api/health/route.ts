import { NextResponse } from 'next/server'
import { storageHealth } from '@/lib/stayza/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  const storage = storageHealth()
  return NextResponse.json(
    {
      ok: storage.configured,
      service: 'little-hut-stayza-direct-booking',
      bookingStore: storage,
      mcp: {
        transport: 'streamable-http',
        endpoint: '/api/mcp',
      },
      checkedAt: new Date().toISOString(),
    },
    { status: storage.configured ? 200 : 503 },
  )
}
