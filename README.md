# @vehicore/sdk

[![npm version](https://img.shields.io/npm/v/@vehicore/sdk.svg)](https://www.npmjs.com/package/@vehicore/sdk)
[![CI](https://github.com/araratmartirossyan/vehicore-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/araratmartirossyan/vehicore-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

Official zero-dependency TypeScript & JavaScript SDK for [Vehicore](https://vehicore.pro) vehicle image processing and automotive data APIs.

Built for **insurance claims automation**, **automotive marketplaces**, **leasing & fleet returns**, and **car auctions**. Works natively in **Node.js 18+**, **Bun**, **Deno**, **Cloudflare Workers**, and **modern browsers**.

- **Website:** [vehicore.pro](https://vehicore.pro)
- **Documentation:** [documentation.vehicore.pro](https://documentation.vehicore.pro)
- **API Reference:** [documentation.vehicore.pro/docs/api-reference](https://documentation.vehicore.pro/docs/api-reference)
- **Free Sandbox:** Sign up at [vehicore.pro/signup](https://vehicore.pro/signup) for 730 free API calls (no credit card required).

---

## Installation

```bash
npm install @vehicore/sdk
# or
yarn add @vehicore/sdk
# or
pnpm add @vehicore/sdk
```

---

## Quick Start

```typescript
import { readFileSync } from 'node:fs'
import { Vehicore } from '@vehicore/sdk'

const vehicore = new Vehicore({
  apiKey: process.env.VEHICORE_API_KEY!,
})

// Extract a license plate from an uncropped smartphone photo
const plate = await vehicore.ocr.plate(readFileSync('./vehicle-front.jpg'))
console.log(plate.result) // "BE 1015-U"
```

### Configuration Options

```typescript
const vehicore = new Vehicore({
  apiKey: process.env.VEHICORE_API_KEY!,
  baseUrl: 'https://api.vehicore.pro', // optional override
  timeoutMs: 30_000, // default request timeout (30s)
  fetch: customFetch, // optional custom fetch implementation
})
```

---

## API Examples

### 1. License Plate & VIN OCR

Extract registration plates and Vehicle Identification Numbers (VINs) from unconstrained vehicle photos without client-side cropping.

```typescript
const plate = await vehicore.ocr.plate(readFileSync('./plate.jpg'))
const vin = await vehicore.ocr.vin(readFileSync('./windshield-vin.jpg'))
```

### 2. Exterior Damage Recognition

Detect dents, scratches, misaligned panels, broken lights, and glass damage with normalized `[0.0, 1.0]` bounding boxes and optional localized descriptions (`userLanguage`).

```typescript
const damage = await vehicore.damage.analyze(readFileSync('./door-dent.jpg'), {
  userLanguage: 'en', // supports BCP-47 tags: 'de', 'fr', 'pt-BR', etc.
  format: 'inspection', // 'default' | 'inspection'
})

for (const item of damage.result) {
  console.log(item.damage_type, item.severity, item.position, item.bounding_box)
}
```

### 3. Car Position & Angle Detection

Identify the exterior viewpoint (`front`, `rear`, `left`, `right`, three-quarter) for guided inspection apps.

```typescript
const angle = await vehicore.carSide.detect(readFileSync('./car.jpg'))
```

### 4. Image Classification (CLIP / ViT)

Filter incoming uploads (exterior photo vs. interior cockpit vs. odometer vs. registration document) and inspect privacy signals.

```typescript
// From binary file
const classified = await vehicore.classify.fromImage('clip', readFileSync('./photo.jpg'), {
  labels: ['car', 'interior', 'odometer', 'registration document'],
})

// Or directly from an image URL
const fromUrl = await vehicore.classify.fromUrl('clip', 'https://example.com/car.jpg', {
  labels: ['car', 'damage', 'tire'],
})
```

### 5. GDPR Anonymization (Plates & Faces)

Automatically detect and blur European/international license plates and human faces before publishing vehicle photos.

```typescript
// Return blurred JPEG/PNG binary
const blurredBuffer = await vehicore.anonymize.all(readFileSync('./car.jpg'), {
  response: 'image',
})

// Or return detected PII bounding boxes as JSON metadata
const regions = await vehicore.anonymize.plates(readFileSync('./car.jpg'), {
  response: 'json',
})
```

### 6. Vehicle Data Normalization

Resolve messy listing text or partial fields into canonical make, model, generation, and year records.

```typescript
const normalized = await vehicore.normalize.text({
  text: 'Toyota Corolla Hybrid 2020',
  country: 'italy',
})
```

### 7. Market Valuation

Retrieve historical price-change and market valuation data.

```typescript
const valuation = await vehicore.valuation.priceChangeData({
  make: 'Toyota',
  model: 'Corolla',
  year: 2020,
})
```

### 8. Studio Catalog Renders (10,000+ Models)

Fetch consistent transparent 3/4 studio PNG renders indexed by vehicle type, make, model, year, and body style.

```typescript
const render = await vehicore.renders.get({
  vehicleType: 'car',
  make: 'porsche',
  model: 'taycan',
  year: 2022,
  body: 'sedan',
})
console.log(render.url, render.qaScore)
```

### 9. Claim Standardization

Process mixed photos and documents into a unified claim payload with configurable pipeline steps.

```typescript
const claim = await vehicore.claim.standardize({
  photos: [readFileSync('./front.jpg'), readFileSync('./rear.jpg')],
  documents: [readFileSync('./registration.pdf')],
  steps: ['anonymize', 'ocr', 'damage', 'structure'],
  metadata: { carSide: 'front' },
})
```

---

## Error Handling

All non-2xx responses throw a typed `VehicoreError` with `status`, `code`, `retryAfter` (populated on `503` / `429` responses), and `details`:

```typescript
import { Vehicore, VehicoreError } from '@vehicore/sdk'

try {
  await vehicore.ocr.plate(imageBuffer)
} catch (error) {
  if (error instanceof VehicoreError) {
    console.error({
      status: error.status,
      code: error.code,
      retryAfter: error.retryAfter,
      message: error.message,
    })
  }
}
```

---

## Contributing & Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## License

[MIT](./LICENSE) © Vehicore
