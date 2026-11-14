import { VehicoreError } from './errors'
import type { BinaryInput, RequestOptions, VehicoreClientOptions } from './types'

const DEFAULT_BASE_URL = 'https://api.vehicore.pro'
const DEFAULT_TIMEOUT_MS = 30_000

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
}

function toBlob(data: Blob | Uint8Array | ArrayBuffer, contentType?: string): Blob {
  if (isBlob(data)) return data
  if (data instanceof ArrayBuffer) {
    return new Blob([data], contentType ? { type: contentType } : undefined)
  }
  const copy = new Uint8Array(data.byteLength)
  copy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
  return new Blob([copy], contentType ? { type: contentType } : undefined)
}

function isNamedBinaryInput(input: BinaryInput): input is {
  data: Blob | Uint8Array | ArrayBuffer
  filename?: string
  contentType?: string
} {
  return typeof input === 'object' && input !== null && 'data' in input
}

export function appendBinaryField(
  form: FormData,
  fieldName: string,
  input: BinaryInput,
  defaultFilename = 'upload.jpg'
): void {
  if (isNamedBinaryInput(input)) {
    const filename = input.filename ?? defaultFilename
    form.append(fieldName, toBlob(input.data, input.contentType), filename)
    return
  }

  const filename =
    isBlob(input) && 'name' in input && typeof input.name === 'string'
      ? input.name
      : defaultFilename
  form.append(fieldName, toBlob(input), filename)
}

export class HttpClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetchImpl: typeof globalThis.fetch
  private readonly defaultTimeoutMs: number

  constructor(options: VehicoreClientOptions) {
    if (!options.apiKey || !options.apiKey.trim()) {
      throw new Error('Vehicore API key is required')
    }

    this.apiKey = options.apiKey.trim()
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)
    this.defaultTimeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const url = new URL(`${this.baseUrl}${normalizedPath}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value))
        }
      }
    }
    return url.toString()
  }

  async requestJson<T>(
    method: 'GET' | 'POST',
    path: string,
    init?: {
      query?: Record<string, string | number | undefined>
      body?: BodyInit
      headers?: Record<string, string>
      includeApiKey?: boolean
      options?: RequestOptions
    }
  ): Promise<T> {
    const response = await this.execute(method, path, init)
    return (await response.json()) as T
  }

  async requestBinary(
    method: 'GET' | 'POST',
    path: string,
    init?: {
      query?: Record<string, string | number | undefined>
      body?: BodyInit
      headers?: Record<string, string>
      includeApiKey?: boolean
      options?: RequestOptions
    }
  ): Promise<ArrayBuffer> {
    const response = await this.execute(method, path, init)
    return response.arrayBuffer()
  }

  private async execute(
    method: 'GET' | 'POST',
    path: string,
    init?: {
      query?: Record<string, string | number | undefined>
      body?: BodyInit
      headers?: Record<string, string>
      includeApiKey?: boolean
      options?: RequestOptions
    }
  ): Promise<Response> {
    const url = this.buildUrl(path, init?.query)
    const headers: Record<string, string> = {
      ...(init?.headers ?? {}),
    }

    if (init?.includeApiKey !== false) {
      headers['X-API-Key'] = this.apiKey
    }

    const timeoutMs = init?.options?.timeoutMs ?? this.defaultTimeoutMs
    const signal =
      init?.options?.signal ??
      (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
        ? AbortSignal.timeout(timeoutMs)
        : undefined)

    const response = await this.fetchImpl(url, {
      method,
      headers,
      body: init?.body,
      signal,
    })

    if (!response.ok) {
      throw await this.parseError(response)
    }

    return response
  }

  private async parseError(response: Response): Promise<VehicoreError> {
    const retryAfterHeader = response.headers.get('Retry-After')
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined

    let payload: unknown
    let message = `Vehicore API request failed with status ${response.status}`
    let code: string | undefined

    try {
      const text = await response.text()
      if (text) {
        try {
          payload = JSON.parse(text) as Record<string, unknown>
          if (payload && typeof payload === 'object') {
            const obj = payload as Record<string, unknown>
            if (typeof obj.message === 'string') message = obj.message
            else if (typeof obj.error === 'string') message = obj.error
            if (typeof obj.code === 'string') code = obj.code
          }
        } catch {
          message = text
        }
      }
    } catch {
      // Ignore body read error and fall back to status message
    }

    return new VehicoreError(message, {
      status: response.status,
      code,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
      details: payload,
    })
  }
}
