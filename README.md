# @vehicore/sdk

Official zero-dependency TypeScript & JavaScript SDK for [Vehicore](https://vehicore.pro) vehicle image processing and automotive data APIs.

Works in **Node.js 18+**, **Bun**, **Deno**, **Cloudflare Workers**, and **modern browsers**.

- Website: [vehicore.pro](https://vehicore.pro)
- Documentation: [documentation.vehicore.pro](https://documentation.vehicore.pro)
- API Reference: [documentation.vehicore.pro/docs/api-reference](https://documentation.vehicore.pro/docs/api-reference)

## Installation

```bash
npm install @vehicore/sdk
# or
yarn add @vehicore/sdk
# or
pnpm add @vehicore/sdk
```

## Quick Start

```typescript
import { readFileSync } from 'node:fs'
import { Vehicore } from '@vehicore/sdk'

const vehicore = new Vehicore({
  apiKey: process.env.VEHICORE_API_KEY!,
})

// 1. Extract license plate from a raw vehicle photo
const plate = await vehicore.ocr.plate(readFileSync('./car-front.jpg'))
console.log(plate.result) // "BE 1015-U"

// 2. Analyze exterior vehicle damage with normalized bounding boxes
const damage = await vehicore.damage.analyze(readFileSync('./door-dent.jpg'), {
  userLanguage: 'en',
  format: 'inspection',
})
console.log(damage.result)
```

## Supported Modules

| Module | Method | Endpoint |
| --- | --- | --- |
| **OCR (Plate & VIN)** | `vehicore.ocr.plate(img)` / `vehicore.ocr.vin(img)` | `POST /api/ocr/plate`, `/api/ocr/vin` |
| **Damage Recognition** | `vehicore.damage.analyze(img, opts)` | `POST /api/damage-recognition` |
| **Car Position** | `vehicore.carSide.detect(img)` | `POST /api/car-side-recognition` |
| **Image Classification** | `vehicore.classify.fromImage(...)` / `fromUrl(...)` | `POST/GET /api/image-classification/:type` |
| **GDPR Anonymization** | `vehicore.anonymize.plates(...)` / `faces(...)` / `all(...)` | `POST /api/anonymize/*` |
| **Data Normalization** | `vehicore.normalize.text(...)` / `selectData(...)` | `POST /api/normalize/*` |
| **Market Valuation** | `vehicore.valuation.priceChangeData(...)` | `POST /api/valuation/price-change-data` |
| **Catalog Renders** | `vehicore.renders.get(query)` | `GET /api/renders` |
| **Claim Standardization** | `vehicore.claim.standardize(...)` / `process(...)` | `POST /api/claim/*` |

## Error Handling

Non-2xx responses throw a typed `VehicoreError` containing `status`, `code`, `retryAfter`, and `details`:

```typescript
import { Vehicore, VehicoreError } from '@vehicore/sdk'

try {
  await vehicore.ocr.plate(imageBuffer)
} catch (error) {
  if (error instanceof VehicoreError) {
    console.error(error.status, error.message, error.retryAfter)
  }
}
```

## License

MIT
