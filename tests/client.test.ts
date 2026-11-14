import { describe, expect, it, vi } from 'vitest'
import { Vehicore, VehicoreError } from '../src'

function createMockFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response> | Response
): typeof globalThis.fetch {
  return vi.fn(handler) as unknown as typeof globalThis.fetch
}

describe('Vehicore SDK', () => {
  it('throws if apiKey is missing or blank', () => {
    expect(() => new Vehicore({ apiKey: '' })).toThrow('Vehicore API key is required')
    expect(() => new Vehicore({ apiKey: '   ' })).toThrow('Vehicore API key is required')
  })

  it('calls OCR plate endpoint with X-API-Key and multipart image', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined

    const mockFetch = createMockFetch(async (url, init) => {
      capturedUrl = url
      capturedInit = init
      return new Response(JSON.stringify({ result: 'BE 1015-U', confidence: 0.989 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    const client = new Vehicore({ apiKey: 'vc_test_key', fetch: mockFetch })
    const res = await client.ocr.plate(new Uint8Array([1, 2, 3]))

    expect(capturedUrl).toBe('https://api.vehicore.pro/api/ocr/plate')
    expect(capturedInit?.method).toBe('POST')
    expect((capturedInit?.headers as Record<string, string>)['X-API-Key']).toBe('vc_test_key')
    expect(capturedInit?.body).toBeInstanceOf(FormData)
    expect((capturedInit?.body as FormData).get('image')).toBeTruthy()
    expect(res.result).toBe('BE 1015-U')
  })

  it('calls damage recognition with userLanguage and format', async () => {
    let capturedForm: FormData | undefined
    const mockFetch = createMockFetch(async (_url, init) => {
      capturedForm = init?.body as FormData
      return new Response(JSON.stringify({ result: [] }), { status: 200 })
    })

    const client = new Vehicore({ apiKey: 'vc_test_key', fetch: mockFetch })
    await client.damage.analyze(new Blob(['img']), {
      userLanguage: 'de',
      format: 'inspection',
    })

    expect(capturedForm?.get('userLanguage')).toBe('de')
    expect(capturedForm?.get('format')).toBe('inspection')
  })

  it('calls catalog renders with query parameters', async () => {
    let capturedUrl = ''
    const mockFetch = createMockFetch(async url => {
      capturedUrl = url
      return new Response(
        JSON.stringify({
          unitId: 'porsche_taycan_j1_sedan',
          displayName: 'Porsche Taycan',
          url: 'https://cdn.vehicore.pro/renders/porsche_taycan_j1_sedan.png',
        }),
        { status: 200 }
      )
    })

    const client = new Vehicore({ apiKey: 'vc_test_key', fetch: mockFetch })
    const res = await client.renders.get({
      vehicleType: 'car',
      make: 'porsche',
      model: 'taycan',
      year: 2022,
      body: 'sedan',
    })

    expect(capturedUrl).toBe(
      'https://api.vehicore.pro/api/renders?vehicleType=car&make=porsche&model=taycan&year=2022&body=sedan'
    )
    expect(res.unitId).toBe('porsche_taycan_j1_sedan')
  })

  it('returns ArrayBuffer when anonymize response=image', async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    const mockFetch = createMockFetch(async () => new Response(bytes, { status: 200 }))

    const client = new Vehicore({ apiKey: 'vc_test_key', fetch: mockFetch })
    const result = await client.anonymize.all(new Uint8Array([1, 2]), { response: 'image' })

    expect(result).toBeInstanceOf(ArrayBuffer)
    expect((result as ArrayBuffer).byteLength).toBe(4)
  })

  it('parses Retry-After and JSON error payload into VehicoreError', async () => {
    const mockFetch = createMockFetch(
      async () =>
        new Response(JSON.stringify({ message: 'Inference capacity reached', code: 'BUSY' }), {
          status: 503,
          headers: { 'Retry-After': '2', 'Content-Type': 'application/json' },
        })
    )

    const client = new Vehicore({ apiKey: 'vc_test_key', fetch: mockFetch })

    await expect(client.ocr.plate(new Uint8Array([1]))).rejects.toMatchObject({
      name: 'VehicoreError',
      status: 503,
      code: 'BUSY',
      retryAfter: 2,
      message: 'Inference capacity reached',
    })

    try {
      await client.ocr.plate(new Uint8Array([1]))
    } catch (err) {
      expect(err).toBeInstanceOf(VehicoreError)
    }
  })

  it('does not attach X-API-Key to public health endpoints', async () => {
    let capturedHeaders: Record<string, string> = {}
    const mockFetch = createMockFetch(async (_url, init) => {
      capturedHeaders = (init?.headers as Record<string, string>) ?? {}
      return new Response(JSON.stringify({ status: 'ok' }), { status: 200 })
    })

    const client = new Vehicore({ apiKey: 'vc_test_key', fetch: mockFetch })
    const res = await client.ocr.health()

    expect(res.status).toBe('ok')
    expect(capturedHeaders['X-API-Key']).toBeUndefined()
  })
})
