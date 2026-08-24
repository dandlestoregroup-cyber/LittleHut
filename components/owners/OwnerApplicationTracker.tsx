'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

interface ApplicationStatus {
  reference: string
  propertyName: string
  status: 'submitted' | 'reviewing' | 'approved' | 'declined'
  createdAt: string
}

const STATUS_COPY: Record<ApplicationStatus['status'], string> = {
  submitted: 'Received. It is queued for structured review.',
  reviewing: 'Under review by the Little Hut team.',
  approved:
    'Approved for activation. Verification, media approval and calendar setup still have to complete before the home can go live.',
  declined: 'Not accepted. The team can explain the reasoning on request.',
}

export function OwnerApplicationTracker() {
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<ApplicationStatus | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function check(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await fetch('/api/public/owner-applications/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reference, email }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(body.error ?? 'Could not check that application.')
        return
      }
      setResult(body.application)
    } catch {
      setError('Could not reach the application record. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="site-shell tracker-layout">
      <form className="standalone-form" onSubmit={check}>
        <h2>Check your application</h2>
        <label>
          Application reference
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="OWNER-YYYYMMDD-XXXXXX"
            required
          />
        </label>
        <label>
          Email used to apply
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        {error && <p className="ops-error">{error}</p>}
        <button className="button button-primary" type="submit" disabled={busy}>
          <Search aria-hidden="true" /> {busy ? 'Checking…' : 'Check status'}
        </button>
      </form>

      <div className="tracker-result">
        {result ? (
          <>
            <span className={`ops-badge ops-badge-${result.status}`}>
              {result.status}
            </span>
            <h2>{result.propertyName}</h2>
            <p>{STATUS_COPY[result.status]}</p>
            <p className="ops-hint">
              Submitted {new Date(result.createdAt).toLocaleDateString()} ·{' '}
              <code>{result.reference}</code>
            </p>
          </>
        ) : (
          <>
            <h2>Your application status appears here.</h2>
            <p>
              We match both the reference and the email before returning any
              application detail.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
