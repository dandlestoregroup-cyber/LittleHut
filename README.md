# Little Hut Vacations — Stayza Direct Booking

This repository is the public Little Hut booking website and its Stayza
Model Context Protocol (MCP) server. A booking or property application is
recorded in the shared booking ledger; neither journey redirects to WhatsApp.

The guest experience follows **The Little Hut Day**: Moment-led discovery,
evidence-backed property truth, and increasingly explicit booking steps. The
core visual system uses linen and terracotta, with midnight reserved for night
Moments. English and Arabic/RTL are first-class interface modes.

## Property truth gate

- `joining` homes may show source-reported Potential Moments only.
- Joining homes never expose dates, public pricing, quotes, or booking actions.
- A home becomes bookable only when its truth state is `verified`, booking is
  enabled, and its public property media is approved.
- Public pages and APIs keep verified inventory separate from Joining Little
  Hut candidates.

## Guest journeys

- Search available dates and guest capacity.
- Review a complete, server-calculated quote.
- Submit a booking request and receive a unique reference.
- Hold selected nights for 12 hours to prevent conflicting requests.
- Track a request using the reference and matching email address.
- Submit a property for owner-review with a saved application reference.

WhatsApp remains an optional support channel in the footer only.

## Stayza MCP

The remote Streamable HTTP endpoint is:

```text
https://<production-domain>/api/mcp
```

It exposes privacy-bounded tools for availability, quotes, booking requests,
booking status, property details, and owner applications. The public connector
does not expose a list of guest records or other back-office personal data.

## Production storage

The deployment must have a **private Vercel Blob store** connected. Vercel
injects `BLOB_READ_WRITE_TOKEN`; the application then uses Blob for bookings,
date locks, status lookups, rate limits, and owner applications.

Production deliberately returns `503` when Blob is missing. It never uses a
server-local file as a production booking ledger.

After connecting Blob, verify:

```bash
curl https://<production-domain>/api/health
```

The response must contain:

```json
{
  "ok": true,
  "bookingStore": {
    "kind": "vercel-blob",
    "productionReady": true
  }
}
```

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The local file store is enabled only when the app is not running on Vercel or
when `STAYZA_ALLOW_FILE_STORE=1`.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

The test suite covers the property truth gate, quoting and minimum-stay
validation, central booking creation, conflict rejection, private status
lookup, and owner applications.
