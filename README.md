# Zeon Backend API

[![Runtime](https://img.shields.io/badge/Runtime-Node.js%20v22+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Language](https://img.shields.io/badge/Language-TypeScript%205-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Framework](https://img.shields.io/badge/Framework-Express.js-black?style=flat-square&logo=express)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![ORM](https://img.shields.io/badge/ORM-Prisma-indigo?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Auth](https://img.shields.io/badge/Auth-Clerk%20Engine-6C47FF?style=flat-square&logo=clerk)](https://clerk.com/)
[![Payments](https://img.shields.io/badge/Payments-Korapay%20Engine-0052FF?style=flat-square)](https://korahq.com/)

---

The official backend for Zeon Systems, an automated B2B logistics, marketplace, cargo pooling, escrow, and shipment operations platform for African commerce.

This service powers the Next.js frontend by exposing authenticated APIs for user profiles, supplier marketplace operations, cargo allocation workflows, Kora payment checkout, shipment tracking, manifest generation, carrier/port visibility, and platform messaging.

## What This Backend Does

Zeon API coordinates the operational flow behind shared cross-border logistics:

1. Marketplace suppliers create stores, products, trade contacts, and bank account payout details.
2. Buyers create cargo allocations from marketplace products.
3. The system calculates landed cost breakdowns for allocations.
4. Cost breakdowns can be negotiated before confirmation.
5. Confirmed allocations create Kora payment intents.
6. Paid allocations move toward cargo pooling, shipment assignment, tracking, and manifest generation.
7. Buyers and store operators can communicate through the messaging API.

## Core Domains

### User

Handles authenticated user profile retrieval/update and notification settings.

Mounted at:

```txt
/api/user
```

### Marketplace

Handles supplier-side marketplace data:

- Stores
- Products
- Trade partners/contact records
- Store bank accounts for global settlement

Mounted at:

```txt
/api/marketplace
```

### Cargo

Handles buyer cargo allocation workflows:

- Create draft cargo allocations
- Update allocation items before confirmation
- Generate landed cost breakdowns
- Confirm allocation and create payment intent
- Cancel allocations where allowed

Mounted at:

```txt
/api/cargo
```

### Payment

Handles settlement-adjacent APIs:

- Update negotiated cost breakdowns
- Fetch payment intents
- Cancel payment intents
- Fetch escrow details

Kora checkout creation happens through the payment provider integration.

Mounted at:

```txt
/api/payment
```

### Carrier

Handles logistics visibility:

- Vessel listings
- Vessel details
- Port listings
- Map data for vessels, ports, and user/org shipment locations

Mounted at:

```txt
/api/carrier
```

### Shipment

Handles shipment visibility and documents:

- List scoped shipments
- Fetch shipment details
- Generate JSON manifest records
- Fetch/download manifests

Mounted at:

```txt
/api/shipment
```

### Messaging

Handles HTTP-based conversations between platform users and store operators/org ops teams.

Trade partners are not platform chat participants; they remain store contact metadata.

Mounted at:

```txt
/api/messaging
```

## Authentication

The API uses Clerk through `@clerk/express`.

All business APIs under `/api/*` are mounted behind:

```ts
clerkMiddleware()
authGuard
```

The backend uses:

- `req.user.userId` for user-scoped ownership.
- `req.user.orgId` for organization-scoped ownership.

Frontend requests should include a Clerk session bearer token:

```http
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

## Data Layer

The backend uses:

- PostgreSQL
- Prisma 7
- Generated Prisma client in `src/generated/prisma`

Main schema:

```txt
prisma/schema.prisma
```

Prisma client helper:

```txt
src/lib/prisma.ts
```

## API Reference

For complete endpoint documentation, request bodies, permissions, and example response data, see:

```txt
API_REFERENCE.md
```

This is the main integration document for the frontend engineer.

## Webhooks

### Clerk

Mounted at:

```txt
/clerk/webhook
```

Used to sync Clerk user lifecycle events into the local database.

### Kora

Mounted at:

```txt
/kora/webhook
```

Used for Kora payment events such as `charge.success`.

## Project Structure

```txt
src/
  api/
    cargo/
    carrier/
    guard/
    marketplace/
    messaging/
    payment/
    shipment/
    user/
  events/
  generated/prisma/
  lib/
  types/
  webhooks/
  server.ts
prisma/
  schema.prisma
  migrations/
```

Each implemented domain follows the same pattern:

```txt
<domain>.route.ts
<domain>.controller.ts
<domain>.service.ts
<domain>.validator.ts
```

Routes define HTTP endpoints, controllers handle auth/response flow, services handle Prisma/database logic, and validators use `express-validator`.

## Environment Variables

Create `.env` in the backend root.

Important variables include:

```txt
PORT=8000
DATABASE_URL=

SVIX_SECRET_KEY=

KORA_API_URL=
KORA_SECRET_KEY=
KORA_REDIRECT_URL=
KORA_WEBHOOK_URL=
```

Use `.env.example` as the local reference where available.

## Scripts

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Validate Prisma schema:

```bash
npx prisma validate
```

Generate Prisma client:

```bash
npx prisma generate
```

Type-check:

```bash
npx tsc
```

Build:

```bash
npm run build
```


## Current Implementation Notes

- Manifest download currently returns structured JSON, not a generated PDF.
- Messaging is HTTP-only for now; websockets can be added later.
- Trade partners are contact records, not authenticated messaging users.
- Bank account routing metadata is validated for selected regions:
  - US requires `routing_number`
  - NG requires `bank_code`
  - DE/FR require `iban`
  This will be made more robust in future iterations.
- The cargo checkout flow intentionally separates cost breakdown generation from allocation confirmation/payment intent creation.
- Only business facing APIs have been implemented