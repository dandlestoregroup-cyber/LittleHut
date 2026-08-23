import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach } from 'node:test'
import { resetRecordStoreForTests } from '../../lib/stayza/storage'

/**
 * Points the shared RecordStore at a fresh temp directory for each test in
 * the calling file, and cleans it up afterward. Mirrors the setup used in
 * tests/booking.test.ts so agent tests exercise the same storage contract
 * production does.
 */
export function setUpTempRecordStore() {
  let dataDirectory = ''

  beforeEach(async () => {
    dataDirectory = await mkdtemp(path.join(tmpdir(), 'stayza-agents-test-'))
    process.env.STAYZA_DATA_DIR = dataDirectory
    process.env.STAYZA_ALLOW_FILE_STORE = '1'
    delete process.env.VERCEL
    resetRecordStoreForTests()
  })

  afterEach(async () => {
    resetRecordStoreForTests()
    await rm(dataDirectory, { recursive: true, force: true })
  })
}

export function futureDate(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
