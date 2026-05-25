# Zeon Backend TODO / API Contract

## Goal

Translate the current `zeon-frontend` mock into a backend that supports:

- organization-owned store discovery and product browsing
- shared cargo reservation and tracking
- vessel and route telemetry
- merchant / partner messaging
- organization settings, notifications, and webhooks
- escrow-aware settlement flow
- manifest generation and download

This document is based on the current frontend behavior in `C:\Users\Administrator\Desktop\Work\zeon\zeon-frontend`.

## 1. Critical Frontend Review

The frontend is visually rich but functionally still a mock. Treat it as a product prototype, not a stable contract.

### Contract risks already visible

1. Data is mostly hardcoded.
   - Marketplace stores, products, vessels, merchants, and cargo entries are all static arrays.
   - The backend must become the source of truth for every list currently rendered from mock data.

2. Several fields are display strings instead of typed values.
   - Examples: `bulkPrice`, `minOrder`, `eta`, `load`, `speed`, `weather`, `reliability`.
   - The API should not persist these as strings. Store structured values and format on the client.

3. Cargo creation is currently unrealistic.
   - Clicking "Add to Cargo" immediately creates a tracked cargo entry with a random ID and hardcoded carrier/origin/ETA/costs.
   - In a real system this should be a draft reservation or pooled cargo allocation that later becomes a shipment.

4. The shipping page mixes domain concepts.
   - The page title is about cruisers/carriers, but the sidebar card is a merchant negotiation desk.
   - Separate `carrier/vessel` from `store-scoped trade partner communication` in the backend.

5. Messaging is simulated only.
   - Negotiation chat uses local state and fake replies.
   - Real backend needs store-linked conversations, designated trade partner contacts, messages, read state, and probably quote/inquiry linkage.

6. Settings imply features that do not exist yet.
   - Logout redirects to `/login`, but no login route exists in the frontend.
   - Sidebar includes `/about`, but that route does not exist.
   - Security tab shows a read-only webhook URL even though the copy says "configure".

7. Naming is inconsistent.
   - The frontend references "Zeon Systems", "White Zexon Corp", and "Zexon Light Logistics Ltd".
   - The backend should normalize tenant/org naming and not inherit branding inconsistencies into schema design.

8. Financial logic is client-side and simplified.
   - Landed cost is calculated in the browser from mock fields.
   - Backend should own tariff logic, tax logic, escrow state, and settlement events.

9. Vessel telemetry is presentation-driven.
   - The map uses 2D screen coordinates and SVG paths.
   - Backend should expose geographic coordinates and route checkpoints, not screen-space values.

10. Documents are implied, not implemented.
   - "Download Shared Manifest Receipt" exists without a backing API or document pipeline.

### What this means for backend design

- build a normalized domain model first
- expose typed DTOs, not UI-formatted strings
- treat current UI labels and statuses as provisional
- keep room for workflow evolution because several UX actions are placeholders

## 2. Recommended Backend Stack

### Recommended default

Use a TypeScript backend to stay aligned with the frontend codebase.

- Runtime: Node.js 22+
- Framework: Fastify
- API schema and validation: Zod + `fastify-type-provider-zod`
- ORM: Prisma
- Database: PostgreSQL
- Auth: JWT access tokens + refresh tokens, or external OIDC if available
- Background jobs: BullMQ + Redis
- File storage: S3-compatible object storage
- Docs: OpenAPI generated from route schemas
- Observability: Pino logs, OpenTelemetry, Sentry

### Why this stack

- Fastify is lightweight and fast for a hackathon-to-production path.
- Zod gives one source of truth for validation and OpenAPI generation.
- Prisma is fast to ship with for relational modeling and migrations.
- PostgreSQL fits the domain well: tenants, orders, messages, events, payments, manifests.

### Acceptable alternative

If you prefer Python, FastAPI + Pydantic + SQLAlchemy/Postgres is also viable, but TypeScript is the lower-friction choice for this repo.

## 3. Core Domain Model

Model the backend around organizations and shared-cargo workflows, not around pages.

Important correction: any organization on the platform can act as a buyer, supplier, or both. Stores and product listings are created by organization users, not by a separate supplier-only actor class.

### Primary entities

1. `organization`
   - SME/customer account using the platform
   - owns users, settings, stores, products, cargo allocations, conversations, payments
   - can act as buyer, supplier, or both depending on workflow

2. `user`
   - member of an organization
   - roles: `owner`, `admin`, `ops_manager`, `finance`, `viewer`

3. `store`
   - marketplace listing shown in the frontend
   - owned by an organization
   - includes category, location, verification, reliability metrics

4. `product`
   - inventory line under a store
   - includes MOQ, pricing basis, unit of measure, availability

5. `trade_partner`
   - designated store-level contact for an import/export store or warehouse
   - handles communication on behalf of the store owner organization
   - this is the messaging target organizations talk to

6. `trade_relationship`
   - optional relationship between two organizations
   - useful for saved partners, negotiated relationships, blocklists, preferred counterparties
   - usually derived from store-level interactions with one or more trade partners

7. `carrier`
   - shipping company/operator

8. `vessel`
   - ship under a carrier
   - capacity, insurance, activity status, telemetry

9. `port`
   - named port node

10. `shipment_route`
   - origin port, destination port, optional checkpoints

11. `cargo_pool`
   - pooled shipment container/shared allocation group
   - several organizations can reserve space in one pool

12. `cargo_allocation`
   - one organization's reserved share in a cargo pool
   - this is the real backend equivalent of "Add to Cargo"

13. `shipment`
   - operational shipment record tied to a cargo pool and optionally a vessel

14. `shipment_event`
   - timeline events such as `BOOKED`, `DEPARTED_ORIGIN`, `ARRIVED_PORT`, `CUSTOMS_HOLD`, `CUSTOMS_RELEASED`

15. `landed_cost_breakdown`
   - structured cost model for allocation/shipment

16. `payment_intent`
   - customer payment session/intent

17. `escrow_record`
   - tracks whether funds are held, partially released, released, refunded

18. `manifest_document`
   - generated receipt / manifest / invoice asset

19. `conversation`
   - negotiation thread between your organization and a store owned by another organization
   - routed to a specific `trade_partner`

20. `message`
   - chat messages inside a conversation

21. `notification_preference`
   - email/SMS/customs-hold alert preferences

22. `webhook_endpoint`
   - customer-configured callback target

23. `webhook_delivery`
   - outbound webhook attempts and retry state

24. `audit_log`
   - important for settings, payments, shipment transitions, and admin actions

## 4. Normalized Field Design

Do not copy the frontend types directly.

### Store and product values

- `bulkPrice: "N45,000"` -> `priceAmountMinor: 4500000`, `currency: "NGN"`, `pricingUnit: "unit"`
- `moq: "100 units"` -> `moqValue: 100`, `moqUnit: "unit"`
- `minOrder: "N7,500,000"` -> `minimumOrderAmountMinor`
- `reliability: "99.4%"` -> `reliabilityScore: 99.4`

### Cargo and shipment values

- `eta: "June 04, 2026"` -> `etaAt: ISO timestamp`
- `progressPercent` can be returned as a computed read-model field, but not as the only source of status
- `origin` / `destination` should reference `port` IDs plus denormalized labels in read models

### Vessel values

- `load: "14,200 TEU (92% Capacity)"` -> `currentLoadTeu`, `capacityTeu`, `utilizationPercent`
- `speed: "19.5 Knots"` -> `speedKnots`
- `weather: "Clear Sea / Light Swell (1.2m)"` -> either omit from core schema or model as external telemetry metadata

### Settings values

- `currency` should be a currency code, not a UI string
- phone/email/webhook values need validation and audit logging

### Store communication values

- each store should expose at least one active `trade_partner`
- a `trade_partner` belongs to both a store and the owning organization
- one organization may assign different trade partners to different stores

## 5. Suggested Enums

### `store_category`

- `electronics`
- `apparel`
- `machinery`
- `eco_goods`
- `food_and_ag`
- `automotive`
- `decor`
- `cosmetics`
- `logistics`

### `shipment_status`

- `draft`
- `pending_pooling`
- `pooled`
- `booked`
- `awaiting_payment`
- `escrow_held`
- `departed_origin`
- `in_transit`
- `arrived_destination`
- `customs_hold`
- `customs_released`
- `delivered`
- `cancelled`

### `payment_status`

- `pending`
- `authorized`
- `paid`
- `failed`
- `refunded`
- `cancelled`

### `escrow_status`

- `not_started`
- `holding`
- `partially_released`
- `released`
- `refunded`
- `disputed`

### `conversation_status`

- `open`
- `closed`
- `archived`

### `message_direction`

- `outbound`
- `inbound`
- `system`

## 6. Table-Level Modeling Suggestion

### `organizations`

- `id`
- `name`
- `legal_name`
- `registration_number`
- `country_code`
- `base_currency`
- `status`
- `created_at`
- `updated_at`

### `users`

- `id`
- `organization_id`
- `full_name`
- `email`
- `phone`
- `password_hash`
- `role`
- `last_login_at`
- `created_at`
- `updated_at`

### `stores`

- `id`
- `organization_id`
- `name`
- `slug`
- `country_code`
- `city`
- `category`
- `logo_url`
- `verification_badge`
- `reliability_score`
- `minimum_order_amount_minor`
- `currency_code`
- `is_active`

### `products`

- `id`
- `store_id`
- `name`
- `description`
- `sku`
- `price_amount_minor`
- `currency_code`
- `pricing_unit`
- `moq_value`
- `moq_unit`
- `image_url`
- `is_active`

### `trade_partners`

- `id`
- `organization_id`
- `store_id`
- `full_name`
- `email`
- `phone`
- `job_title`
- `is_primary`
- `handles_imports`
- `handles_exports`
- `is_active`

### `trade_relationships`

- `id`
- `organization_id`
- `counterparty_organization_id`
- `relationship_type`
- `status`
- `notes`
- `created_by_user_id`

### `carriers`

- `id`
- `name`
- `insurance_status`
- `verification_status`

### `vessels`

- `id`
- `carrier_id`
- `name`
- `imo_number`
- `type`
- `capacity_teu`
- `current_load_teu`
- `utilization_percent`
- `avg_speed_knots`
- `is_active`
- `current_lat`
- `current_lng`
- `current_heading_degrees`
- `last_telemetry_at`
- `image_url`

### `ports`

- `id`
- `code`
- `name`
- `country_code`
- `lat`
- `lng`

### `cargo_pools`

- `id`
- `route_id`
- `vessel_id`
- `departure_port_id`
- `arrival_port_id`
- `departure_eta_at`
- `arrival_eta_at`
- `total_capacity_units`
- `reserved_capacity_units`
- `status`

### `cargo_allocations`

- `id`
- `organization_id`
- `cargo_pool_id`
- `store_id`
- `product_id`
- `quantity`
- `quantity_unit`
- `status`
- `quoted_amount_minor`
- `final_amount_minor`
- `currency_code`
- `created_by_user_id`

### `shipments`

- `id`
- `cargo_pool_id`
- `reference_code`
- `status`
- `origin_port_id`
- `destination_port_id`
- `carrier_id`
- `vessel_id`
- `booked_at`
- `departed_at`
- `arrived_at`
- `delivered_at`

### `shipment_events`

- `id`
- `shipment_id`
- `event_type`
- `occurred_at`
- `port_id`
- `notes`
- `metadata_json`

### `landed_cost_breakdowns`

- `id`
- `cargo_allocation_id`
- `base_cost_minor`
- `tariff_rate_bps`
- `tariff_amount_minor`
- `customs_fee_minor`
- `vat_rate_bps`
- `vat_amount_minor`
- `other_fee_minor`
- `total_amount_minor`
- `currency_code`

### `payment_intents`

- `id`
- `organization_id`
- `cargo_allocation_id`
- `provider`
- `provider_reference`
- `amount_minor`
- `currency_code`
- `status`
- `checkout_url`
- `expires_at`

### `escrow_records`

- `id`
- `payment_intent_id`
- `status`
- `held_amount_minor`
- `released_amount_minor`
- `released_at`
- `release_condition`

### `manifest_documents`

- `id`
- `shipment_id`
- `cargo_allocation_id`
- `document_type`
- `storage_key`
- `mime_type`
- `generated_at`

### `conversations`

- `id`
- `organization_id`
- `counterparty_organization_id`
- `store_id`
- `trade_partner_id`
- `subject`
- `status`
- `last_message_at`

### `messages`

- `id`
- `conversation_id`
- `sender_user_id`
- `direction`
- `body`
- `sent_at`
- `read_at`

### `notification_preferences`

- `id`
- `organization_id`
- `notify_email`
- `notify_sms`
- `notify_customs_hold`
- `notify_manifest_ready`

### `webhook_endpoints`

- `id`
- `organization_id`
- `target_url`
- `secret`
- `is_active`
- `subscribed_events_json`

## 7. API Surface

Use `/api/v1` as the base path.

### 7.1 Auth

#### `POST /api/v1/auth/register`

Create organization + first user.

Request:

```json
{
  "organizationName": "Zexon Light Logistics Ltd",
  "legalName": "Zexon Light Logistics Limited",
  "registrationNumber": "RC-1794021",
  "contactName": "Tunde Balogun",
  "email": "tunde@zexonlight.com",
  "phone": "+2348123456789",
  "password": "strong-password"
}
```

#### `POST /api/v1/auth/login`

Request:

```json
{
  "email": "tunde@zexonlight.com",
  "password": "strong-password"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": "usr_123",
    "organizationId": "org_123",
    "fullName": "Tunde Balogun",
    "role": "owner"
  }
}
```

#### `POST /api/v1/auth/logout`

- invalidate refresh token / session

#### `POST /api/v1/auth/refresh`

- issue new access token

#### `POST /api/v1/auth/password-reset/request`
#### `POST /api/v1/auth/password-reset/confirm`

### 7.2 Organization and settings

#### `GET /api/v1/organization`
#### `PATCH /api/v1/organization`

Fields from settings page:

- business/legal name
- registration number
- contact name
- email
- phone
- base currency

#### `GET /api/v1/settings/notifications`
#### `PATCH /api/v1/settings/notifications`

Request:

```json
{
  "notifyEmail": true,
  "notifySms": false,
  "notifyCustomsHold": true,
  "notifyManifestReady": true
}
```

#### `GET /api/v1/settings/webhooks`
#### `POST /api/v1/settings/webhooks`
#### `PATCH /api/v1/settings/webhooks/:id`
#### `DELETE /api/v1/settings/webhooks/:id`

### 7.3 Marketplace

#### `GET /api/v1/stores`

Query params:

- `search`
- `category`
- `countryCode`
- `page`
- `pageSize`
- `sort`

Response shape:

```json
{
  "items": [
    {
      "id": "st_01",
      "name": "Apex Electronics Wholesale",
      "countryCode": "CN",
      "city": "Shenzhen",
      "category": "electronics",
      "logoUrl": "https://...",
      "reliabilityScore": 99.4,
      "verificationBadge": "top_verified",
      "minimumOrderAmountMinor": 750000000,
      "currencyCode": "NGN"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 30
}
```

#### `GET /api/v1/stores/:id`

Should include featured products for the store modal plus the store's trade partner summary.

#### `GET /api/v1/products`

Optional if frontend later needs a cross-store catalog search.

### 7.4 Cargo allocations and shipments

This is the core module.

#### `POST /api/v1/cargo-allocations`

Create a draft allocation when user clicks "Add to Cargo".

Request:

```json
{
  "storeId": "st_01",
  "productId": "prd_01",
  "quantity": 100,
  "quantityUnit": "unit",
  "destinationPortCode": "LOS"
}
```

Behavior:

- validate MOQ
- compute quote
- assign or create a suitable cargo pool
- return draft allocation with provisional landed cost

Response:

```json
{
  "id": "alloc_123",
  "status": "pending_pooling",
  "cargoPoolId": "pool_456",
  "shipmentReference": "WZ-441-TCAN",
  "product": {
    "id": "prd_01",
    "name": "OLED Smart Panels"
  },
  "costBreakdown": {
    "baseCostMinor": 450000000,
    "tariffRateBps": 500,
    "tariffAmountMinor": 22500000,
    "customsFeeMinor": 15000000,
    "vatRateBps": 750,
    "vatAmountMinor": 36562500,
    "totalAmountMinor": 524062500,
    "currencyCode": "NGN"
  }
}
```

#### `GET /api/v1/cargo-allocations`

List allocations for current organization. This powers the cargo page list.

Useful query params:

- `status`
- `page`
- `pageSize`

#### `GET /api/v1/cargo-allocations/:id`

Return full detail for right-side landed cost ledger.

#### `PATCH /api/v1/cargo-allocations/:id`

Only for editable draft state. Example: change quantity before payment.

#### `POST /api/v1/cargo-allocations/:id/confirm`

Lock allocation for payment/booking.

#### `POST /api/v1/cargo-allocations/:id/cancel`

#### `GET /api/v1/shipments`
#### `GET /api/v1/shipments/:id`

Shipment detail should include:

- status
- origin port
- destination port
- carrier
- vessel
- ETA
- events timeline
- progressPercent as a computed convenience field
- escrow status

### 7.5 Manifest and document downloads

#### `POST /api/v1/shipments/:id/manifest`

- generate or queue manifest generation

#### `GET /api/v1/shipments/:id/manifest`

- return latest manifest metadata and signed download URL

#### `GET /api/v1/documents/:id/download`

- direct signed download or redirect

### 7.6 Carriers, vessels, ports, dashboard

#### `GET /api/v1/dashboard/map`

Recommended dashboard aggregator endpoint for the main map page.

Response should include:

- tracked vessels
- relevant ports
- active shipments for current organization

#### `GET /api/v1/vessels`
#### `GET /api/v1/vessels/:id`
#### `GET /api/v1/ports`

Vessel response should expose real coordinates and optionally a frontend projection block:

```json
{
  "id": "vsl_001",
  "name": "Evergreen Horizon",
  "carrier": {
    "id": "car_01",
    "name": "COSCO Shipping Lines"
  },
  "capacityTeu": 14200,
  "currentLoadTeu": 13064,
  "utilizationPercent": 92,
  "speedKnots": 19.5,
  "telemetry": {
    "lat": 4.1,
    "lng": 6.2,
    "headingDegrees": 240,
    "lastUpdatedAt": "2026-05-25T09:00:00Z"
  },
  "route": {
    "originPortCode": "SZN",
    "destinationPortCode": "LOS",
    "etaAt": "2026-05-28T00:00:00Z"
  }
}
```

### 7.7 Trade partners and messaging

Clarification: `trade_partner` is not the canonical business entity. The canonical business is still the store-owning `organization`, but each store exposes one or more `trade_partner` contacts that handle communication for that store or warehouse.

Backing model:

- canonical business record = `organization`
- commercial surface = `store`
- messaging contact = `trade_partner`
- optional saved relationship = `trade_relationship`

#### `GET /api/v1/trade-partners`

Query params:

- `search`
- `countryCode`
- `verified`
- `partnerType`

Response items should be store-centric with organization context:

```json
{
  "items": [
    {
      "storeId": "st_01",
      "storeName": "Apex Electronics Wholesale",
      "organizationId": "org_789",
      "organizationName": "Apex Global Trading Ltd",
      "country": "Nigeria",
      "countryCode": "NG",
      "verifiedStatus": true,
      "partnerType": "supplier",
      "tradePartner": {
        "id": "tp_123",
        "fullName": "Alhaji Musa Dikko",
        "jobTitle": "Export Manager",
        "handlesImports": false,
        "handlesExports": true
      }
    }
  ]
}
```

#### `GET /api/v1/trade-partners/:id`
#### `GET /api/v1/stores/:id/trade-partners`

#### `POST /api/v1/conversations`

Create or reopen a negotiation thread.

Request:

```json
{
  "storeId": "st_01",
  "counterpartyOrganizationId": "org_789",
  "tradePartnerId": "tp_123",
  "subject": "Import inquiry for OLED Smart Panels"
}
```

#### `GET /api/v1/conversations`
#### `GET /api/v1/conversations/:id/messages`

#### `POST /api/v1/conversations/:id/messages`

Request:

```json
{
  "body": "What volume discounts can you offer for 100 units to Lagos?"
}
```

#### `POST /api/v1/conversations/:id/close`

### 7.8 Payments and escrow

README mentions Korapay and milestone-gated escrow, so this needs first-class backend support even though the frontend does not yet show a checkout screen.

#### `POST /api/v1/payments/intents`

Create payment intent for a cargo allocation.

Request:

```json
{
  "cargoAllocationId": "alloc_123",
  "paymentMethod": "bank_transfer"
}
```

Response:

```json
{
  "id": "pay_123",
  "status": "pending",
  "amountMinor": 524062500,
  "currencyCode": "NGN",
  "provider": "korapay",
  "checkoutUrl": "https://..."
}
```

#### `GET /api/v1/payments/intents/:id`
#### `POST /api/v1/payments/intents/:id/cancel`

#### `GET /api/v1/escrow/:cargoAllocationId`

Return:

- payment state
- escrow state
- release conditions
- event history

### 7.9 Webhooks

#### `POST /api/v1/webhooks/korapay`

Inbound provider webhook.

Rules:

- verify signature
- persist raw payload
- process idempotently
- enqueue heavy side effects

#### `POST /api/v1/webhooks/carriers/:provider`

If carrier telemetry or status events later come from external systems.

#### outbound events to customer webhooks

Suggested event names:

- `cargo_allocation.created`
- `payment.paid`
- `escrow.holding`
- `shipment.status_changed`
- `shipment.customs_hold`
- `shipment.customs_released`
- `manifest.ready`

## 8. Read Models the Frontend Actually Needs

To keep the frontend simple, provide thin read models tailored to each page.

### Dashboard map card model

- vessel id
- vessel name
- carrier name
- ETA timestamp
- capacity/utilization
- telemetry position
- purchase/allocation position only if the business actually tracks this

### Marketplace card model

- store id
- store name
- category
- city/country
- reliability score
- minimum order amount
- featured items summary

### Cargo list model

- allocation/shipment reference
- title
- status
- origin label
- destination label
- ETA
- progress percent
- selected material/product summary
- escrow status

### Cargo details model

- unit economics
- landed cost breakdown
- customs/escrow notice
- manifest availability

### Shipping page model

- active carriers/vessels summary
- store trade partner directory summary
- conversation previews

## 9. Business Rules

1. All money should be stored in minor units.
   - Example: `NGN 45,000` becomes `4500000` if using kobo.

2. All rates should be stored as basis points.
   - Example: 7.5% -> `750`.

3. MOQ must be enforced server-side.

4. Draft allocations should be editable only before payment/booking.

5. Shipment status should move through explicit transitions.
   - Do not allow arbitrary status mutation from the client.

6. Escrow release must be driven by verifiable events.
   - Example: offload confirmed + customs cleared.

7. Webhooks and payment callbacks must be idempotent.

8. Conversations should be organization-scoped.
   - A user from org A must never see org B messages or shipments.

9. A store can only be created and managed by users belonging to the owning organization.

10. A product can only be created under a store owned by the authenticated user's organization.

11. Every store used for marketplace communication should have at least one active primary trade partner.

12. Manifest downloads should use signed URLs or authorized stream endpoints.

13. Every critical mutation should be audited.

## 10. Validation Rules

### Organization/profile

- business name required
- email unique per user
- phone normalized to E.164
- registration number validated by format at minimum

### Marketplace and cargo

- `storeId` must exist and be active
- `productId` must belong to `storeId`
- quantity must be numeric and `>= MOQ`
- destination port must be supported

### Store and listing ownership

- only organization admins/authorized users can create stores
- only owning organization users can create/update/archive products
- store slug should be unique

### Trade partner validation

- a `trade_partner` must belong to the specified `store_id`
- the `trade_partner.organization_id` must match the `store.organization_id`
- only the owning organization can create/update/deactivate a store's trade partners
- when opening a conversation, `tradePartnerId` must belong to the specified `storeId`

### Messaging

- conversation must belong to current org
- message body length limits
- rate-limit sends

### Webhooks

- HTTPS URLs only
- allow secret rotation
- retry with exponential backoff

## 11. Background Jobs

Use a queue for:

- manifest PDF generation
- payment reconciliation
- webhook delivery retries
- notification fanout
- shipment telemetry ingestion
- landed cost recalculation when rates change

## 12. Security Requirements

1. JWT auth with refresh token rotation.
2. RBAC at organization level.
3. Signed inbound webhook verification.
4. Encrypted webhook secrets and provider credentials.
5. Rate limiting on auth and messaging routes.
6. Audit log for settings, payments, shipment status changes.
7. Soft delete where business records should remain traceable.

## 13. Suggested Folder Structure

If using Fastify:

```text
backend/
  src/
    app.ts
    server.ts
    config/
    db/
    plugins/
    modules/
      auth/
      organization/
      settings/
      organizations/
      stores/
      trade-partners/
      products/
      cargo/
      shipments/
      vessels/
      ports/
      partners/
      conversations/
      payments/
      escrow/
      manifests/
      webhooks/
      notifications/
    lib/
    jobs/
    schemas/
    types/
  prisma/
    schema.prisma
    migrations/
```

## 14. Suggested Delivery Order

### Phase 1: foundations

- initialize backend project
- configure Postgres, Prisma, env handling
- implement auth, organization, users
- generate OpenAPI

### Phase 2: marketplace

- stores and products read APIs
- filters/search/pagination

### Phase 3: cargo core

- cargo pools
- cargo allocations
- landed cost calculation service
- shipment and shipment events

### Phase 4: payments and escrow

- Korapay integration
- payment intents
- escrow records
- webhook processing

### Phase 5: documents and notifications

- manifest generation
- notification preferences
- outbound webhooks

### Phase 6: messaging

- trade partner directory
- conversations
- messages

## 15. Open Questions to Resolve Early

These are not blockers for scaffolding, but they affect schema details.

1. Is the platform multi-tenant from day one, or is it effectively one business per deployment?
2. Does "Add to Cargo" mean:
   - reserve pooled container space
   - create a purchase order
   - or just save a draft?
3. Are marketplace merchants the same entities as export-desk trade partners?
4. Is vessel telemetry live from an external provider or manually administered?
5. What exact Korapay flow is intended:
   - one payment per allocation
   - one payment per pooled shipment
   - or installment/milestone release?
6. Is the manifest receipt a PDF, JSON export, or both?
7. Will messaging remain internal app chat, or should it bridge to email/WhatsApp later?
8. Are customs fees fixed, estimated, or recalculated from tariffs and declarations?

## 16. Immediate Actionable TODO

1. Scaffold backend app and OpenAPI-first route structure.
2. Create Prisma schema for:
   - organizations
   - users
   - trade_partners
   - trade_relationships
   - stores
   - products
   - carriers
   - vessels
   - ports
   - cargo_pools
   - cargo_allocations
   - shipments
   - shipment_events
   - landed_cost_breakdowns
   - payment_intents
   - escrow_records
   - manifest_documents
   - conversations
   - messages
   - notification_preferences
   - webhook_endpoints
   - audit_logs
3. Implement auth + organization settings first so the rest of the APIs can be tenant-scoped correctly.
4. Implement read-only marketplace and dashboard endpoints next so the frontend can stop using mock arrays.
5. Implement cargo allocation flow before payment integration.
6. Add Korapay payment intent + webhook handling.
7. Add manifest generation and signed download endpoint.
8. Replace frontend mock chat with organization-to-organization messaging once contact ownership and partner-directory rules are finalized.

## 17. Bottom Line

The current frontend suggests a backend centered on:

- tenant-aware B2B sourcing
- pooled cargo reservations
- shipment tracking with event history
- escrow-backed settlement
- partner negotiation threads

Do not mirror the frontend mock types 1:1. Normalize the schema, expose typed APIs, and let the frontend format presentation values from clean server data.
