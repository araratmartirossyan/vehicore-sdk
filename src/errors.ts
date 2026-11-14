/**
 * Typed error thrown when the Vehicore API returns a non-2xx response or a network error occurs.
 */
export class VehicoreError extends Error {
  readonly status: number
  readonly code?: string
  readonly retryAfter?: number
  readonly details?: unknown

  constructor(
    message: string,
    options: {
      status: number
      code?: string
      retryAfter?: number
      details?: unknown
    }
  ) {
    super(message)
    this.name = 'VehicoreError'
    this.status = options.status
    this.code = options.code
    this.retryAfter = options.retryAfter
    this.details = options.details
  }
}
