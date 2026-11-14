import { appendBinaryField, HttpClient } from './http'
import type {
  AnonymizeJsonResponse,
  AnonymizeOptions,
  BinaryInput,
  CarSideResponse,
  CatalogRendersQuery,
  CatalogRendersResponse,
  ClaimProcessInput,
  ClaimResponse,
  ClaimStandardizeInput,
  ClassificationModel,
  DamageAnalysisOptions,
  DamageAnalysisResponse,
  HealthResponse,
  ImageClassificationOptions,
  ImageClassificationResponse,
  NormalizeResponse,
  NormalizeSelectDataInput,
  NormalizeTextInput,
  OcrPlateResponse,
  OcrVinResponse,
  RequestOptions,
  ValuationPriceChangeInput,
  ValuationResponse,
  VehicoreClientOptions,
} from './types'

/**
 * Official TypeScript/JavaScript client for the Vehicore API.
 */
export class Vehicore {
  private readonly http: HttpClient

  readonly ocr: {
    health: (options?: RequestOptions) => Promise<HealthResponse>
    plate: (image: BinaryInput, options?: RequestOptions) => Promise<OcrPlateResponse>
    vin: (image: BinaryInput, options?: RequestOptions) => Promise<OcrVinResponse>
  }

  readonly damage: {
    health: (options?: RequestOptions) => Promise<HealthResponse>
    analyze: (
      image: BinaryInput,
      options?: DamageAnalysisOptions
    ) => Promise<DamageAnalysisResponse>
  }

  readonly carSide: {
    health: (options?: RequestOptions) => Promise<HealthResponse>
    detect: (image: BinaryInput, options?: RequestOptions) => Promise<CarSideResponse>
  }

  readonly classify: {
    health: (options?: RequestOptions) => Promise<HealthResponse>
    fromImage: (
      model: ClassificationModel,
      image: BinaryInput,
      options?: ImageClassificationOptions
    ) => Promise<ImageClassificationResponse>
    fromUrl: (
      model: ClassificationModel,
      imageUrl: string,
      options?: ImageClassificationOptions
    ) => Promise<ImageClassificationResponse>
  }

  readonly anonymize: {
    plates: (
      image: BinaryInput,
      options?: AnonymizeOptions
    ) => Promise<AnonymizeJsonResponse | ArrayBuffer>
    faces: (
      image: BinaryInput,
      options?: AnonymizeOptions
    ) => Promise<AnonymizeJsonResponse | ArrayBuffer>
    all: (
      image: BinaryInput,
      options?: AnonymizeOptions
    ) => Promise<AnonymizeJsonResponse | ArrayBuffer>
  }

  readonly normalize: {
    health: (options?: RequestOptions) => Promise<HealthResponse>
    text: (input: NormalizeTextInput, options?: RequestOptions) => Promise<NormalizeResponse>
    selectData: (
      input: NormalizeSelectDataInput,
      options?: RequestOptions
    ) => Promise<NormalizeResponse>
  }

  readonly valuation: {
    health: (options?: RequestOptions) => Promise<HealthResponse>
    priceChangeData: (
      input: ValuationPriceChangeInput,
      options?: RequestOptions
    ) => Promise<ValuationResponse>
  }

  readonly renders: {
    get: (query: CatalogRendersQuery, options?: RequestOptions) => Promise<CatalogRendersResponse>
  }

  readonly claim: {
    health: (options?: RequestOptions) => Promise<HealthResponse>
    standardize: (input: ClaimStandardizeInput, options?: RequestOptions) => Promise<ClaimResponse>
    process: (input: ClaimProcessInput, options?: RequestOptions) => Promise<ClaimResponse>
  }

  constructor(options: VehicoreClientOptions) {
    this.http = new HttpClient(options)

    this.ocr = {
      health: opt =>
        this.http.requestJson('GET', '/api/ocr/health', { includeApiKey: false, options: opt }),
      plate: (image, opt) => {
        const form = new FormData()
        appendBinaryField(form, 'image', image, 'plate.jpg')
        return this.http.requestJson('POST', '/api/ocr/plate', { body: form, options: opt })
      },
      vin: (image, opt) => {
        const form = new FormData()
        appendBinaryField(form, 'image', image, 'vin.jpg')
        return this.http.requestJson('POST', '/api/ocr/vin', { body: form, options: opt })
      },
    }

    this.damage = {
      health: opt =>
        this.http.requestJson('GET', '/api/damage-recognition/health', {
          includeApiKey: false,
          options: opt,
        }),
      analyze: (image, opt) => {
        const form = new FormData()
        appendBinaryField(form, 'image', image, 'vehicle.jpg')
        if (opt?.userLanguage) form.append('userLanguage', opt.userLanguage)
        if (opt?.format) form.append('format', opt.format)
        return this.http.requestJson('POST', '/api/damage-recognition', {
          body: form,
          options: opt,
        })
      },
    }

    this.carSide = {
      health: opt =>
        this.http.requestJson('GET', '/api/car-side-recognition/health', {
          includeApiKey: false,
          options: opt,
        }),
      detect: (image, opt) => {
        const form = new FormData()
        appendBinaryField(form, 'image', image, 'car.jpg')
        return this.http.requestJson('POST', '/api/car-side-recognition', {
          body: form,
          options: opt,
        })
      },
    }

    this.classify = {
      health: opt =>
        this.http.requestJson('GET', '/api/image-classification/health', {
          includeApiKey: false,
          options: opt,
        }),
      fromImage: (model, image, opt) => {
        const form = new FormData()
        appendBinaryField(form, 'image', image, 'photo.jpg')
        const labels = Array.isArray(opt?.labels) ? opt.labels.join(',') : opt?.labels
        return this.http.requestJson('POST', `/api/image-classification/${model}`, {
          query: labels ? { labels } : undefined,
          body: form,
          options: opt,
        })
      },
      fromUrl: (model, imageUrl, opt) => {
        const labels = Array.isArray(opt?.labels) ? opt.labels.join(',') : opt?.labels
        return this.http.requestJson('GET', `/api/image-classification/${model}`, {
          query: {
            url: imageUrl,
            labels,
          },
          options: opt,
        })
      },
    }

    const runAnonymize = (path: string, image: BinaryInput, opt?: AnonymizeOptions) => {
      const form = new FormData()
      appendBinaryField(form, 'image', image, 'photo.jpg')
      const query = {
        response: opt?.response,
        padding: opt?.padding,
        shrink: opt?.shrink,
        blur: opt?.blur,
      }
      if (opt?.response === 'image') {
        return this.http.requestBinary('POST', path, { query, body: form, options: opt })
      }
      return this.http.requestJson<AnonymizeJsonResponse>('POST', path, {
        query,
        body: form,
        options: opt,
      })
    }

    this.anonymize = {
      plates: (image, opt) => runAnonymize('/api/anonymize', image, opt),
      faces: (image, opt) => runAnonymize('/api/anonymize/face', image, opt),
      all: (image, opt) => runAnonymize('/api/anonymize/all', image, opt),
    }

    this.normalize = {
      health: opt =>
        this.http.requestJson('GET', '/api/normalize/health', {
          includeApiKey: false,
          options: opt,
        }),
      text: (input, opt) =>
        this.http.requestJson('POST', '/api/normalize/normalize-text', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          options: opt,
        }),
      selectData: (input, opt) =>
        this.http.requestJson('POST', '/api/normalize/normalize-select-data', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          options: opt,
        }),
    }

    this.valuation = {
      health: opt =>
        this.http.requestJson('GET', '/api/valuation/health', {
          includeApiKey: false,
          options: opt,
        }),
      priceChangeData: (input, opt) =>
        this.http.requestJson('POST', '/api/valuation/price-change-data', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          options: opt,
        }),
    }

    this.renders = {
      get: (query, opt) =>
        this.http.requestJson('GET', '/api/renders', {
          query: {
            vehicleType: query.vehicleType,
            make: query.make,
            model: query.model,
            year: query.year,
            body: query.body,
          },
          options: opt,
        }),
    }

    this.claim = {
      health: opt =>
        this.http.requestJson('GET', '/api/claim/health', {
          includeApiKey: false,
          options: opt,
        }),
      standardize: (input, opt) => {
        const form = new FormData()
        input.photos?.forEach((photo, idx) =>
          appendBinaryField(form, 'photos', photo, `photo-${idx + 1}.jpg`)
        )
        input.documents?.forEach((doc, idx) =>
          appendBinaryField(form, 'documents', doc, `document-${idx + 1}.pdf`)
        )
        if (input.metadata) {
          form.append('metadata', JSON.stringify(input.metadata))
        }
        return this.http.requestJson('POST', '/api/claim/standardize', {
          query: input.steps?.length ? { steps: input.steps.join(',') } : undefined,
          body: form,
          options: opt,
        })
      },
      process: (input, opt) => {
        const form = new FormData()
        input.files.forEach((file, idx) =>
          appendBinaryField(form, 'files', file, `file-${idx + 1}`)
        )
        if (input.metadata) {
          form.append('metadata', JSON.stringify(input.metadata))
        }
        return this.http.requestJson('POST', '/api/claim/process', {
          body: form,
          options: opt,
        })
      },
    }
  }
}
