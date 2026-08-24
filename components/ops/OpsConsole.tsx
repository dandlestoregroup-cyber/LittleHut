'use client'

import { useCallback, useEffect, useState } from 'react'

type Tab = 'bookings' | 'applications' | 'exceptions'

interface Overview {
  actorId: string
  counts: {
    bookingsPending: number
    bookingsConfirmed: number
    applicationsOpen: number
    exceptionsOpen: number
  }
  bookings: Array<{
    reference: string
    propertyName: string
    guestName: string
    guestEmail: string
    guestPhone: string
    adults: number
    children: number
    checkIn: string
    checkOut: string
    status: string
    paymentStatus: string
    specialRequests?: string
    holdExpiresAt: string
    createdAt: string
    quote: { total: number; currency: string; nights: number }
  }>
  ownerApplications: Array<{
    reference: string
    ownerName: string
    email: string
    phone: string
    propertyName: string
    location: string
    propertyType: string
    bedrooms: number
    maxGuests: number
    operationNotes: string
    status: string
    createdAt: string
  }>
  exceptions: Array<{
    reference: string
    category: string
    summary: string
    reason: string
    recommendedAction: string
    responsibleRole: string
    priority: string
    resolutionState: string
    createdAt: string
  }>
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function OpsConsole({ configured }: { configured: boolean }) {
  const [signedIn, setSignedIn] = useState(false)
  const [accessKey, setAccessKey] = useState('')
  const [actorId, setActorId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState<Overview | null>(null)
  const [tab, setTab] = useState<Tab>('bookings')

  const load = useCallback(async () => {
    const response = await fetch('/api/ops/overview', { cache: 'no-store' })
    if (response.status === 401) {
      setSignedIn(false)
      setData(null)
      return
    }
    if (!response.ok) {
      setError('Could not load the operations overview.')
      return
    }
    setData(await response.json())
    setSignedIn(true)
  }, [])

  useEffect(() => {
    if (!configured) return
    fetch('/api/ops/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((session) => {
        if (session.signedIn) void load()
      })
      .catch(() => undefined)
  }, [configured, load])

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/ops/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accessKey, actorId: actorId || undefined }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setError(body.error ?? 'Sign-in failed.')
        return
      }
      setAccessKey('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    await fetch('/api/ops/session', { method: 'DELETE' })
    setSignedIn(false)
    setData(null)
  }

  async function decideBooking(reference: string, status: string) {
    setBusy(true)
    try {
      await fetch(`/api/ops/bookings/${encodeURIComponent(reference)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function decideApplication(reference: string, status: string) {
    setBusy(true)
    try {
      await fetch(
        `/api/ops/owner-applications/${encodeURIComponent(reference)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function resolveException(reference: string) {
    setBusy(true)
    try {
      await fetch(`/api/ops/exceptions/${encodeURIComponent(reference)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes: 'Resolved from the operations console.' }),
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return (
      <div className="ops-card ops-notice">
        <h2>Operator access is not configured</h2>
        <p>
          This deployment has no <code>OPS_ACCESS_KEY</code> set, so the
          operations console refuses every request rather than defaulting open.
          Set <code>OPS_ACCESS_KEY</code> (and optionally{' '}
          <code>OPS_SESSION_SECRET</code>) in the environment, then reload.
        </p>
      </div>
    )
  }

  if (!signedIn) {
    return (
      <form className="ops-card ops-signin" onSubmit={signIn}>
        <h2>Operations sign-in</h2>
        <p>Enter the operator access key issued for this deployment.</p>
        <label>
          Access key
          <input
            type="password"
            value={accessKey}
            onChange={(event) => setAccessKey(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          Your name or initials <span className="ops-optional">(for the audit trail)</span>
          <input
            type="text"
            value={actorId}
            onChange={(event) => setActorId(event.target.value)}
            placeholder="e.g. mo"
          />
        </label>
        {error && <p className="ops-error">{error}</p>}
        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Sign in'}
        </button>
      </form>
    )
  }

  if (!data) return <div className="ops-card">Loading…</div>

  return (
    <div className="ops-console">
      <div className="ops-topbar">
        <div className="ops-counts">
          <span><b>{data.counts.bookingsPending}</b> pending requests</span>
          <span><b>{data.counts.bookingsConfirmed}</b> confirmed</span>
          <span><b>{data.counts.applicationsOpen}</b> owner applications</span>
          <span><b>{data.counts.exceptionsOpen}</b> open exceptions</span>
        </div>
        <div className="ops-session">
          <span>Signed in as <b>{data.actorId}</b></span>
          <button className="button button-quiet" onClick={signOut} type="button">
            Sign out
          </button>
        </div>
      </div>

      <div className="ops-tabs" role="tablist">
        {(['bookings', 'applications', 'exceptions'] as Tab[]).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={tab === name ? 'ops-tab ops-tab-active' : 'ops-tab'}
            onClick={() => setTab(name)}
          >
            {name === 'bookings' && `Bookings (${data.bookings.length})`}
            {name === 'applications' &&
              `Owner applications (${data.ownerApplications.length})`}
            {name === 'exceptions' && `Exceptions (${data.exceptions.length})`}
          </button>
        ))}
      </div>

      {tab === 'bookings' && (
        <div className="ops-list">
          {data.bookings.length === 0 && (
            <div className="ops-card ops-empty">No booking requests yet.</div>
          )}
          {data.bookings.map((booking) => (
            <article className="ops-card" key={booking.reference}>
              <header className="ops-row">
                <div>
                  <h3>{booking.propertyName}</h3>
                  <code>{booking.reference}</code>
                </div>
                <span className={`ops-badge ops-badge-${booking.status}`}>
                  {booking.status}
                </span>
              </header>
              <dl className="ops-grid">
                <div><dt>Guest</dt><dd>{booking.guestName}</dd></div>
                <div><dt>Email</dt><dd>{booking.guestEmail}</dd></div>
                <div><dt>Phone</dt><dd>{booking.guestPhone}</dd></div>
                <div><dt>Dates</dt><dd>{booking.checkIn} → {booking.checkOut} ({booking.quote.nights}n)</dd></div>
                <div><dt>Guests</dt><dd>{booking.adults + booking.children}</dd></div>
                <div><dt>Total</dt><dd>{formatMoney(booking.quote.total, booking.quote.currency)}</dd></div>
                <div><dt>Payment</dt><dd>{booking.paymentStatus}</dd></div>
                <div><dt>Hold expires</dt><dd>{new Date(booking.holdExpiresAt).toLocaleString()}</dd></div>
              </dl>
              {booking.specialRequests && (
                <p className="ops-note"><b>Requests:</b> {booking.specialRequests}</p>
              )}
              {booking.status === 'requested' && (
                <div className="ops-actions">
                  <button
                    className="button button-primary"
                    type="button"
                    disabled={busy}
                    onClick={() => decideBooking(booking.reference, 'confirmed')}
                  >
                    Confirm booking
                  </button>
                  <button
                    className="button button-outline"
                    type="button"
                    disabled={busy}
                    onClick={() => decideBooking(booking.reference, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              )}
              {booking.status === 'confirmed' && (
                <div className="ops-actions">
                  <button
                    className="button button-quiet"
                    type="button"
                    disabled={busy}
                    onClick={() => decideBooking(booking.reference, 'cancelled')}
                  >
                    Cancel booking
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === 'applications' && (
        <div className="ops-list">
          {data.ownerApplications.length === 0 && (
            <div className="ops-card ops-empty">No owner applications yet.</div>
          )}
          {data.ownerApplications.map((application) => (
            <article className="ops-card" key={application.reference}>
              <header className="ops-row">
                <div>
                  <h3>{application.propertyName}</h3>
                  <code>{application.reference}</code>
                </div>
                <span className={`ops-badge ops-badge-${application.status}`}>
                  {application.status}
                </span>
              </header>
              <dl className="ops-grid">
                <div><dt>Owner</dt><dd>{application.ownerName}</dd></div>
                <div><dt>Email</dt><dd>{application.email}</dd></div>
                <div><dt>Phone</dt><dd>{application.phone}</dd></div>
                <div><dt>Location</dt><dd>{application.location}</dd></div>
                <div><dt>Type</dt><dd>{application.propertyType}</dd></div>
                <div><dt>Bedrooms</dt><dd>{application.bedrooms}</dd></div>
                <div><dt>Max guests</dt><dd>{application.maxGuests}</dd></div>
                <div><dt>Submitted</dt><dd>{new Date(application.createdAt).toLocaleDateString()}</dd></div>
              </dl>
              <p className="ops-note"><b>Operation:</b> {application.operationNotes}</p>
              <div className="ops-actions">
                <button className="button button-outline" type="button" disabled={busy}
                  onClick={() => decideApplication(application.reference, 'reviewing')}>
                  Mark reviewing
                </button>
                <button className="button button-primary" type="button" disabled={busy}
                  onClick={() => decideApplication(application.reference, 'approved')}>
                  Approve for activation
                </button>
                <button className="button button-quiet" type="button" disabled={busy}
                  onClick={() => decideApplication(application.reference, 'declined')}>
                  Decline
                </button>
              </div>
              <p className="ops-hint">
                Approving records the decision. Publishing the home to the public
                catalogue still requires the separate, human-confirmed activation
                step — approval here never puts a home live on its own.
              </p>
            </article>
          ))}
        </div>
      )}

      {tab === 'exceptions' && (
        <div className="ops-list">
          {data.exceptions.length === 0 && (
            <div className="ops-card ops-empty">No exceptions raised.</div>
          )}
          {data.exceptions.map((exception) => (
            <article className="ops-card" key={exception.reference}>
              <header className="ops-row">
                <div>
                  <h3>{exception.summary}</h3>
                  <code>{exception.reference}</code>
                </div>
                <span className={`ops-badge ops-badge-${exception.priority}`}>
                  {exception.priority}
                </span>
              </header>
              <dl className="ops-grid">
                <div><dt>Category</dt><dd>{exception.category.replaceAll('_', ' ')}</dd></div>
                <div><dt>Owner</dt><dd>{exception.responsibleRole}</dd></div>
                <div><dt>State</dt><dd>{exception.resolutionState}</dd></div>
                <div><dt>Raised</dt><dd>{new Date(exception.createdAt).toLocaleString()}</dd></div>
              </dl>
              <p className="ops-note"><b>Why:</b> {exception.reason}</p>
              <p className="ops-note"><b>Recommended:</b> {exception.recommendedAction}</p>
              {exception.resolutionState === 'open' && (
                <div className="ops-actions">
                  <button className="button button-primary" type="button" disabled={busy}
                    onClick={() => resolveException(exception.reference)}>
                    Mark resolved
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
