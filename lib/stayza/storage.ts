import {
  BlobPreconditionFailedError,
  BlobStoreNotFoundError,
  del,
  get,
  list,
  put,
} from '@vercel/blob'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('The private Stayza booking store is not configured.')
  }
}

export class RecordConflictError extends Error {
  constructor(public readonly pathname: string) {
    super(`A record already exists at ${pathname}.`)
  }
}

interface StoredRecord<T> {
  value: T
  etag?: string
  pathname: string
}

export interface RecordStore {
  kind: 'vercel-blob' | 'local-file' | 'unconfigured'
  putJson<T>(
    pathname: string,
    value: T,
    options?: { overwrite?: boolean },
  ): Promise<StoredRecord<T>>
  getJson<T>(pathname: string): Promise<StoredRecord<T> | null>
  listJson<T>(prefix: string): Promise<Array<StoredRecord<T>>>
  delete(pathname: string, etag?: string): Promise<void>
}

function blobConfigured() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL_OIDC_TOKEN && process.env.BLOB_STORE_ID),
  )
}

class VercelBlobRecordStore implements RecordStore {
  kind = 'vercel-blob' as const

  async putJson<T>(
    pathname: string,
    value: T,
    options: { overwrite?: boolean } = {},
  ): Promise<StoredRecord<T>> {
    try {
      const blob = await put(pathname, JSON.stringify(value), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: options.overwrite ?? false,
        cacheControlMaxAge: 60,
        contentType: 'application/json',
      })
      return { value, etag: blob.etag, pathname: blob.pathname }
    } catch (error) {
      if (!options.overwrite) {
        const existing = await this.getJson<T>(pathname).catch(() => null)
        if (existing) throw new RecordConflictError(pathname)
      }
      if (error instanceof BlobStoreNotFoundError) {
        throw new StorageNotConfiguredError()
      }
      throw error
    }
  }

  async getJson<T>(pathname: string): Promise<StoredRecord<T> | null> {
    const result = await get(pathname, { access: 'private', useCache: false })
    if (!result || result.statusCode !== 200) return null
    const value = JSON.parse(await new Response(result.stream).text()) as T
    return { value, etag: result.blob.etag, pathname: result.blob.pathname }
  }

  async listJson<T>(prefix: string): Promise<Array<StoredRecord<T>>> {
    const records: Array<StoredRecord<T>> = []
    let cursor: string | undefined
    do {
      const page = await list({ prefix, cursor, limit: 1000 })
      const values = await Promise.all(
        page.blobs.map((blob) => this.getJson<T>(blob.pathname)),
      )
      records.push(
        ...values.filter((value): value is StoredRecord<T> => Boolean(value)),
      )
      cursor = page.hasMore ? page.cursor : undefined
    } while (cursor)
    return records
  }

  async delete(pathname: string, etag?: string): Promise<void> {
    try {
      await del(pathname, etag ? { ifMatch: etag } : undefined)
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) return
      throw error
    }
  }
}

class LocalFileRecordStore implements RecordStore {
  kind = 'local-file' as const
  private readonly root =
    process.env.STAYZA_DATA_DIR ?? path.join(process.cwd(), '.data')

  private fullPath(pathname: string) {
    const normalized = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '')
    return path.join(this.root, normalized)
  }

  async putJson<T>(
    pathname: string,
    value: T,
    options: { overwrite?: boolean } = {},
  ): Promise<StoredRecord<T>> {
    const target = this.fullPath(pathname)
    await mkdir(path.dirname(target), { recursive: true })
    try {
      await writeFile(target, JSON.stringify(value, null, 2), {
        encoding: 'utf8',
        flag: options.overwrite ? 'w' : 'wx',
      })
    } catch (error) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        error.code === 'EEXIST'
      ) {
        throw new RecordConflictError(pathname)
      }
      throw error
    }
    return { value, pathname }
  }

  async getJson<T>(pathname: string): Promise<StoredRecord<T> | null> {
    try {
      const value = JSON.parse(
        await readFile(this.fullPath(pathname), 'utf8'),
      ) as T
      return { value, pathname }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return null
      }
      throw error
    }
  }

  async listJson<T>(prefix: string): Promise<Array<StoredRecord<T>>> {
    const directory = this.fullPath(prefix)
    const records: Array<StoredRecord<T>> = []
    const walk = async (current: string) => {
      let entries
      try {
        entries = await readdir(current, { withFileTypes: true })
      } catch (error) {
        if (
          typeof error === 'object' &&
          error &&
          'code' in error &&
          error.code === 'ENOENT'
        ) {
          return
        }
        throw error
      }
      for (const entry of entries) {
        const target = path.join(current, entry.name)
        if (entry.isDirectory()) await walk(target)
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const pathname = path
            .relative(this.root, target)
            .split(path.sep)
            .join('/')
          const record = await this.getJson<T>(pathname)
          if (record) records.push(record)
        }
      }
    }
    await walk(directory)
    return records
  }

  async delete(pathname: string): Promise<void> {
    await rm(this.fullPath(pathname), { force: true })
  }
}

class UnconfiguredRecordStore implements RecordStore {
  kind = 'unconfigured' as const
  private fail(): never {
    throw new StorageNotConfiguredError()
  }
  async putJson<T>(): Promise<StoredRecord<T>> {
    return this.fail()
  }
  async getJson<T>(): Promise<StoredRecord<T> | null> {
    return this.fail()
  }
  async listJson<T>(): Promise<Array<StoredRecord<T>>> {
    return this.fail()
  }
  async delete(): Promise<void> {
    return this.fail()
  }
}

let store: RecordStore | undefined

export function getRecordStore(): RecordStore {
  if (store) return store
  if (blobConfigured()) store = new VercelBlobRecordStore()
  else if (!process.env.VERCEL || process.env.STAYZA_ALLOW_FILE_STORE === '1') {
    store = new LocalFileRecordStore()
  } else {
    store = new UnconfiguredRecordStore()
  }
  return store
}

export function resetRecordStoreForTests() {
  store = undefined
}
