/**
 * Binary or Blob-like file input accepted by Vehicore vision endpoints.
 * Works seamlessly in Node.js (Buffer / Uint8Array / Blob), Bun, Deno, and browsers (File / Blob).
 */
export type BinaryInput =
  | Blob
  | Uint8Array
  | ArrayBuffer
  | {
      data: Blob | Uint8Array | ArrayBuffer
      filename?: string
      contentType?: string
    }

export interface VehicoreClientOptions {
  /** Vehicore API key sent via the `X-API-Key` header. */
  apiKey: string
  /** Base API URL. Defaults to `https://api.vehicore.pro`. */
  baseUrl?: string
  /** Optional custom `fetch` implementation (useful for proxies, tests, or custom runtimes). */
  fetch?: typeof globalThis.fetch
  /** Default request timeout in milliseconds. Defaults to `30000`. */
  timeoutMs?: number
}

export interface RequestOptions {
  /** Per-request timeout override in milliseconds. */
  timeoutMs?: number
  /** Optional AbortSignal to cancel the request. */
  signal?: AbortSignal
}

export interface HealthResponse {
  status: string
  [key: string]: unknown
}

export interface OcrPlateResponse {
  result: string
  confidence?: number
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  executionTimeMs?: number
  [key: string]: unknown
}

export interface OcrVinResponse {
  result: string
  [key: string]: unknown
}

export interface DamageBoundingBox {
  ymin: number
  xmin: number
  ymax: number
  xmax: number
}

export interface DamageFinding {
  damage_type: string
  severity: string
  confidence: string
  position: string
  recommendation: string
  description: string
  bounding_box?: DamageBoundingBox
  [key: string]: unknown
}

export interface DamageAnalysisOptions extends RequestOptions {
  /** BCP-47 tag (e.g. `de`, `fr`, `en-US`) or English language name. */
  userLanguage?: string
  /** Output format: `default` or `inspection` (part-by-part). */
  format?: 'default' | 'inspection'
}

export interface DamageAnalysisResponse {
  result: DamageFinding[]
  inspection?: unknown
  [key: string]: unknown
}

export interface CarSideResponse {
  result?: string
  side?: string
  confidence?: number
  [key: string]: unknown
}

export type ClassificationModel = 'clip' | 'vit'

export interface ImageClassificationOptions extends RequestOptions {
  /** Comma-separated or array of candidate labels (for `clip`). */
  labels?: string | string[]
}

export interface ImageClassificationResponse {
  result: string
  confidence: number
  model: string
  anonymization?: {
    mustAnonymize: boolean
    reasons: string[]
    detected: {
      face: boolean
      licensePlate: boolean
      vin: boolean
      personalDocument: boolean
    }
    counts: {
      faces: number
      licensePlates: number
    }
  }
  predictions?: Array<{ label: string; score: number }>
  [key: string]: unknown
}

export type AnonymizeResponseMode = 'mixed' | 'image' | 'json'

export interface AnonymizeOptions extends RequestOptions {
  /** `mixed` (default JSON + image), `image` (binary image), or `json` (metadata only). */
  response?: AnonymizeResponseMode
  padding?: number
  shrink?: number
  blur?: number
}

export interface AnonymizeJsonResponse {
  regions?: Array<{
    type: string
    confidence: number
    boundingBox?: Record<string, number>
  }>
  [key: string]: unknown
}

export interface NormalizeTextInput {
  text: string
  country: string
}

export interface NormalizeSelectDataInput {
  country: string
  make?: string
  model?: string
  year?: number
  fuel?: string
  gearbox?: string
  [key: string]: unknown
}

export interface NormalizeResponse {
  [key: string]: unknown
}

export interface ValuationPriceChangeInput {
  make?: string
  model?: string
  year?: number
  country?: string
  fuel?: string
  gearbox?: string
  mileage?: number
  [key: string]: unknown
}

export interface ValuationResponse {
  [key: string]: unknown
}

export interface CatalogRendersQuery {
  vehicleType: 'car' | 'van' | 'motorcycle' | string
  make: string
  model: string
  year: number | string
  body?: string
}

export interface CatalogRendersResponse {
  unitId: string
  displayName: string
  generation?: {
    name: string
    start: number
    end: number
  }
  body?: string
  angle?: string
  primaryBody?: boolean
  width?: number
  height?: number
  qaScore?: number
  url: string
  expiresAt?: string
  [key: string]: unknown
}

export type ClaimStep = 'anonymize' | 'ocr' | 'damage' | 'structure'

export interface ClaimStandardizeInput {
  photos?: BinaryInput[]
  documents?: BinaryInput[]
  metadata?: Record<string, unknown>
  steps?: ClaimStep[]
}

export interface ClaimProcessInput {
  files: BinaryInput[]
  metadata?: Record<string, unknown>
}

export interface ClaimResponse {
  [key: string]: unknown
}
