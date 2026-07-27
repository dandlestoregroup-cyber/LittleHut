export const OFFICIAL_PHONE = '01270228656'
export const WHATSAPP_PHONE = '201270228656'

export type GuestEnquiry = {
  reference: string
  createdAt: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  childrenAges: string
  stayType: string
  name: string
  mobile: string
  notes: string
  status: 'Ready to send'
}

export type OwnerSubmission = {
  reference: string
  createdAt: string
  updatedAt: string
  status: string
  step: number
  owner: Record<string, string | boolean>
  property: Record<string, string | number>
  features: string[]
  guestLove: string
  restrictions: string
  photos: Array<{ name: string; category: string; dataUrl: string }>
  operations: Record<string, string>
  commercial: Record<string, string | boolean>
  declarations: Record<string, boolean>
  history: Array<{ at: string; reviewer: string; previous: string; next: string; note?: string }>
}

const guestKey = 'lhv_guest_enquiries_v1'
const ownerKey = 'lhv_owner_submissions_v1'
const draftKey = 'lhv_owner_draft_v1'

export function makeReference(prefix: 'LHV' | 'PROP') {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const tail = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${date}-${tail}`
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function saveGuestEnquiry(enquiry: GuestEnquiry) {
  const all = readJson<GuestEnquiry[]>(guestKey, [])
  writeJson(guestKey, [enquiry, ...all.filter((item) => item.reference !== enquiry.reference)])
}

export function saveOwnerDraft(submission: OwnerSubmission) {
  writeJson(draftKey, submission)
}

export function loadOwnerDraft() {
  return readJson<OwnerSubmission | null>(draftKey, null)
}

export function clearOwnerDraft() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(draftKey)
}

export function saveOwnerSubmission(submission: OwnerSubmission) {
  const all = readJson<OwnerSubmission[]>(ownerKey, [])
  writeJson(ownerKey, [submission, ...all.filter((item) => item.reference !== submission.reference)])
  writeJson(draftKey, submission)
}

export function getOwnerSubmissions() {
  return readJson<OwnerSubmission[]>(ownerKey, [])
}

export function getOwnerSubmission(reference: string) {
  return getOwnerSubmissions().find((item) => item.reference.toLowerCase() === reference.toLowerCase()) || null
}

export function buildGuestMessage(enquiry: GuestEnquiry) {
  return [
    'Hello Little Hut Vacations,',
    'I would like to send a stay enquiry.',
    `Reference: ${enquiry.reference}`,
    `Check-in: ${enquiry.checkIn}`,
    `Check-out: ${enquiry.checkOut}`,
    `Adults: ${enquiry.adults}`,
    `Children: ${enquiry.children}`,
    enquiry.children ? `Children ages: ${enquiry.childrenAges || 'Not provided'}` : '',
    `Preferred stay: ${enquiry.stayType}`,
    `Guest name: ${enquiry.name}`,
    `Mobile: ${enquiry.mobile}`,
    `Notes: ${enquiry.notes || 'None'}`,
  ].filter(Boolean).join('\n')
}

export function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`
}
