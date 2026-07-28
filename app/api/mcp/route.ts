import { createMcpHandler } from 'mcp-handler'
import { z } from 'zod'
import { getPropertyById, properties } from '@/lib/stayza/catalog'
import { buildQuote, formatEgp } from '@/lib/stayza/pricing'
import {
  availablePropertyIds,
  createBooking,
  createOwnerApplication,
  enforceRateLimit,
  getAvailability,
  getBookingStatus,
} from '@/lib/stayza/service'
import {
  bookingRequestSchema,
  bookingStatusSchema,
  ownerApplicationSchema,
  quoteSchema,
  searchSchema,
} from '@/lib/stayza/validation'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function text(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  }
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'search_available_stays',
      'Search Little Hut properties using real Stayza date locks. Never claim availability without calling this tool.',
      {
        checkIn: z.string().date().describe('Check-in date in YYYY-MM-DD format'),
        checkOut: z.string().date().describe('Check-out date in YYYY-MM-DD format'),
        guests: z.number().int().min(1).max(20),
      },
      async (raw) => {
        const input = searchSchema.parse(raw)
        const available = new Set(await availablePropertyIds(input))
        const results = properties
          .filter((property) => available.has(property.id))
          .map((property) => ({
            propertyId: property.id,
            property: property.name,
            location: property.location,
            maxGuests: property.maxGuests,
            bedrooms: property.bedrooms,
            quote: buildQuote({ propertyId: property.id, ...input }),
          }))
        return text({ search: input, results })
      },
    )

    server.tool(
      'quote_stay',
      'Calculate the authoritative Stayza quote and verify that the selected nights are still available.',
      {
        propertyId: z.string().min(1),
        checkIn: z.string().date(),
        checkOut: z.string().date(),
        guests: z.number().int().min(1).max(20),
      },
      async (raw) => {
        const input = quoteSchema.parse(raw)
        const result = await getAvailability(input)
        return text({
          ...result,
          displayTotal: formatEgp(result.quote.total),
        })
      },
    )

    server.tool(
      'submit_booking_request',
      'Create a real direct-booking request and hold the available nights for 12 hours. Use only after the guest confirms the dates, guest count, contact details, and quoted total.',
      {
        propertyId: z.string().min(1),
        guestName: z.string().min(1).max(120),
        guestEmail: z.string().email(),
        guestPhone: z.string().min(8).max(30),
        adults: z.number().int().min(1).max(20),
        children: z.number().int().min(0).max(20),
        checkIn: z.string().date(),
        checkOut: z.string().date(),
        specialRequests: z.string().max(1000).optional(),
      },
      async (raw) => {
        const input = bookingRequestSchema.parse({
          ...raw,
          source: 'stayza_mcp',
          consent: true,
          website: '',
        })
        await enforceRateLimit('booking', `mcp:${input.guestEmail}`, 3)
        const { consent: _consent, website: _website, ...bookingInput } = input
        const result = await createBooking(bookingInput)
        return text({
          created: true,
          reference: result.booking.reference,
          property: result.booking.propertyName,
          checkIn: result.booking.checkIn,
          checkOut: result.booking.checkOut,
          total: result.booking.quote.total,
          currency: result.booking.quote.currency,
          status: result.booking.status,
          holdExpiresAt: result.booking.holdExpiresAt,
          nextStep:
            'Little Hut reviews payment and confirmation. Do not claim the booking is confirmed while status is requested.',
        })
      },
    )

    server.tool(
      'check_booking_status',
      'Check one booking when the guest supplies both the booking reference and the matching email. This tool never lists bookings or reveals unrelated guest data.',
      {
        reference: z.string().min(1).max(40),
        email: z.string().email(),
      },
      async (raw) => {
        const input = bookingStatusSchema.parse(raw)
        const booking = await getBookingStatus(input.reference, input.email)
        return text(
          booking ?? {
            found: false,
            message: 'No booking matched that reference and email.',
          },
        )
      },
    )

    server.tool(
      'submit_property_application',
      'Submit a property for Little Hut review. This creates an owner application in Stayza; it does not open WhatsApp and does not promise acceptance.',
      {
        ownerName: z.string().min(1).max(120),
        email: z.string().email(),
        phone: z.string().min(8).max(30),
        propertyName: z.string().min(1).max(160),
        location: z.string().min(1).max(200),
        propertyType: z.enum(['villa', 'chalet', 'apartment', 'other']),
        bedrooms: z.number().int().min(0).max(30),
        maxGuests: z.number().int().min(1).max(50),
        operationNotes: z.string().min(20).max(2000),
      },
      async (raw) => {
        const input = ownerApplicationSchema.parse({
          ...raw,
          consent: true,
          website: '',
        })
        await enforceRateLimit(
          'owner-application',
          `mcp:${input.email}`,
          2,
        )
        const { consent: _consent, website: _website, ...applicationInput } = input
        const application = await createOwnerApplication(applicationInput)
        return text({
          submitted: true,
          reference: application.reference,
          status: application.status,
        })
      },
    )

    server.tool(
      'get_property_details',
      'Get the verified public booking facts for one Little Hut property.',
      { propertyId: z.string().min(1) },
      async ({ propertyId }) => {
        const property = getPropertyById(propertyId)
        return text(
          property
            ? {
                id: property.id,
                name: property.name,
                location: property.location,
                description: property.description,
                maxGuests: property.maxGuests,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                features: property.features,
                minimumNights: property.minimumNights,
                fromRate: property.minimumSuggestedRate,
                currency: property.currency,
              }
            : { found: false },
        )
      },
    )
  },
  {
    serverInfo: {
      name: 'Stayza Direct Booking',
      version: '1.0.0',
    },
    capabilities: {
      tools: {},
    },
  },
  {
    basePath: '/api',
    maxDuration: 30,
    verboseLogs: false,
  },
)

export { handler as GET, handler as POST, handler as DELETE }
