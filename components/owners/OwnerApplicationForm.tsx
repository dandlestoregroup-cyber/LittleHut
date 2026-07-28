'use client'

import { FormEvent, useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'

export function OwnerApplicationForm() {
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/public/owner-applications', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ownerName: form.get('ownerName'),
          email: form.get('email'),
          phone: form.get('phone'),
          propertyName: form.get('propertyName'),
          location: form.get('location'),
          propertyType: form.get('propertyType'),
          bedrooms: form.get('bedrooms'),
          maxGuests: form.get('maxGuests'),
          operationNotes: form.get('operationNotes'),
          consent: form.get('consent') === 'on',
          website: form.get('website'),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Could not submit the property.')
      setReference(body.application.reference)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not submit the property.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (reference) {
    return (
      <div className="site-shell owner-success">
        <CheckCircle2 />
        <span className="eyebrow">Application saved in Stayza</span>
        <h2>Thank you. We have the property.</h2>
        <p>
          Your review reference is <b>{reference}</b>. Little Hut will review
          the home, operating standard, and guest-service fit before any listing
          is created.
        </p>
      </div>
    )
  }

  return (
    <form className="site-shell owner-form" onSubmit={submit}>
      <div className="owner-form-intro">
        <span className="eyebrow">Little Hut review</span>
        <h2>Start with the operating truth.</h2>
        <p>
          We are not an open marketplace. The quality of the home matters, and
          so does what happens before, during, and after every guest stay.
        </p>
        <ul>
          <li>Property and capacity fit</li>
          <li>Reliable cleaning and maintenance</li>
          <li>Clear access and guest support</li>
          <li>Accurate availability and pricing</li>
        </ul>
      </div>
      <div className="owner-form-fields">
        <h3>Your details</h3>
        <div className="form-grid">
          <label className="form-span-two"><span>Full name</span><input name="ownerName" autoComplete="name" required /></label>
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
          <label><span>Mobile number</span><input name="phone" type="tel" autoComplete="tel" required /></label>
        </div>
        <h3>The property</h3>
        <div className="form-grid">
          <label className="form-span-two"><span>Property name</span><input name="propertyName" required /></label>
          <label className="form-span-two"><span>Location / compound</span><input name="location" required /></label>
          <label>
            <span>Property type</span>
            <select name="propertyType" required>
              <option value="villa">Villa</option>
              <option value="chalet">Chalet</option>
              <option value="apartment">Apartment</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label><span>Bedrooms</span><input name="bedrooms" type="number" min="0" max="30" required /></label>
          <label><span>Maximum guests</span><input name="maxGuests" type="number" min="1" max="50" required /></label>
          <label className="form-span-two">
            <span>How is the property operated?</span>
            <textarea
              name="operationNotes"
              rows={6}
              minLength={20}
              maxLength={2000}
              placeholder="Who handles cleaning, maintenance, access, guest support, and availability today?"
              required
            />
          </label>
          <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <label className="consent-row">
          <input name="consent" type="checkbox" required />
          <span>I agree that Little Hut may contact me to review this application.</span>
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-full" disabled={submitting}>
          <Send />{submitting ? 'Saving application…' : 'Submit for review'}
        </button>
      </div>
    </form>
  )
}
