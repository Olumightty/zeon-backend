# Zeon Backend API Reference

This document describes the API surface currently implemented in the backend. It is intended for connecting the Next.js frontend to the Express API.

## Base URL

Local development default:

```txt
http://localhost:8000
```

All business APIs are mounted under `/api/*`.

## Authentication

All `/api/*` routes are mounted behind Clerk middleware and `authGuard`.

Frontend requests should send the Clerk session token:

```http
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

The backend reads:

- `req.user.userId` for user-scoped records.
- `req.user.orgId` for organization-scoped records when the user is acting inside a Clerk organization.

## Common Response Shape

Most JSON responses follow:

```json
{
  "message": "Human readable result",
  "status": true,
  "data": {}
}
```

Validation errors:

```json
{
  "message": "Invalid request parameters",
  "status": false,
  "errors": []
}
```

Server errors:

```json
{
  "message": "Unable to process request",
  "status": false
}
```

Money fields ending in `Minor` are minor units, for example kobo/cents. `BigInt` fields are serialized as strings in responses.

## Common Enums

### StoreCategory

`ELECTRONICS`, `APPAREL`, `MACHINERY`, `ECO_GOODS`, `FOOD_AND_AG`, `AUTOMOTIVE`, `DECOR`, `COSMETICS`, `LOGISTICS`

### PricingUnit

`UNIT`, `METER`, `KILOGRAM`, `LITER`, `TON`, `SHEET`, `SLOT`, `CONTAINER`, `CARTON`, `PACK`

### ShipmentStatus

`DRAFT`, `PENDING_POOLING`, `POOLED`, `BOOKED`, `AWAITING_PAYMENT`, `ESCROW_HELD`, `DEPARTED_ORIGIN`, `IN_TRANSIT`, `ARRIVED_DESTINATION`, `CUSTOMS_HOLD`, `CUSTOMS_RELEASED`, `DELIVERED`, `CANCELLED`

### VesselType

`SHIP`, `PLANE`, `TRUCK`, `TRAIN`

### ConversationStatus

`OPEN`, `CLOSED`, `ARCHIVED`

### ConversationParticipantRole

`REQUESTER`, `RESPONDER`, `ASSIGNEE`

### BankAccountType

`SAVINGS`, `CURRENT`, `CHECKING`

### AccountHolderType

`INDIVIDUAL`, `BUSINESS`

## Health

### GET `/`

Returns a simple health response.

```json
{
  "message": "Hello from Zeon Systems"
}
```

## User API

Base path: `/api/user`

### GET `/api/user`

Fetch the authenticated user's profile.

**Response data includes:** user profile, memberships with organization, stores, notification preference.

### PATCH `/api/user`

Update authenticated user's profile.

**Body**

```json
{
  "firstName": "Ada",
  "lastName": "Okafor",
  "phone": "+2348012345678",
  "profileImageUrl": "https://example.com/avatar.png"
}
```

All fields are optional, but at least one must be provided.

### GET `/api/user/settings/notifications`

Fetch notification settings. If missing, defaults are created.

### PATCH `/api/user/settings/notifications`

Update notification settings.

**Body**

```json
{
  "notifyEmail": true,
  "notifySms": false,
  "notifyCustomsHold": true,
  "notifyManifestReady": true
}
```

All fields are optional, but at least one must be provided.

## Marketplace API

Base path: `/api/marketplace`

### GET `/api/marketplace/stores`

List active marketplace stores.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `search` | string | Searches store name and city |
| `category` | StoreCategory | Uppercased by validator |
| `countryCode` | string | 2-letter country code |
| `city` | string | Partial city match |
| `mine` | boolean | If true, returns user/org-owned stores |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

**Response data**

```json
{
  "stores": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

### POST `/api/marketplace/stores`

Create a store. Personal users create user-owned stores. Org users must be `OWNER` or `ADMIN`.

**Body**

```json
{
  "name": "Lagos Components",
  "slug": "lagos-components",
  "countryCode": "NG",
  "city": "Lagos",
  "category": "ELECTRONICS",
  "logoUrl": "https://example.com/logo.png",
  "verificationBadge": "TOP_VERIFIED",
  "reliabilityScore": 92.5,
  "minimumOrderAmountMinor": 5000000,
  "currencyCode": "NGN"
}
```

Required: `name`, `countryCode`, `city`, `category`, `currencyCode`.

### GET `/api/marketplace/stores/:id`

Fetch one active store.

### PATCH `/api/marketplace/stores/:id`

Update a store. Only the user owner or org `OWNER`/`ADMIN` can update.

Accepts the same fields as create, all optional, plus:

```json
{
  "isActive": true
}
```

### DELETE `/api/marketplace/stores/:id`

Soft-delete a store by setting `isActive` to false. Same permissions as update.

### GET `/api/marketplace/stores/:id/products`

List active products in a store.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `search` | string | Searches product name and SKU |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

### POST `/api/marketplace/stores/:id/products`

Create a product in a store. Requires store management permission.

**Body**

```json
{
  "name": "Wireless Telemetry Node",
  "description": "Industrial telemetry hardware",
  "sku": "WTN-001",
  "priceAmountMinor": 18500000,
  "currencyCode": "NGN",
  "pricingUnit": "UNIT",
  "moqValue": 10,
  "moqUnit": "UNIT",
  "imageUrl": "https://example.com/product.png"
}
```

Required: `name`, `priceAmountMinor`, `currencyCode`, `pricingUnit`, `moqValue`, `moqUnit`.

### GET `/api/marketplace/stores/:id/products/:pid`

Fetch one active product in a store.

### PATCH `/api/marketplace/stores/:id/products/:pid`

Update a product. Requires store management permission.

Accepts create fields as optional, plus:

```json
{
  "isActive": true
}
```

### DELETE `/api/marketplace/stores/:id/products/:pid`

Soft-delete a product by setting `isActive` to false.

### GET `/api/marketplace/stores/:id/trade-partners`

List active trade partners for a store.

### GET `/api/marketplace/stores/:id/trade-partners/:tpid`

Fetch one active trade partner.

### POST `/api/marketplace/stores/:id/trade-partners`

Create a store trade partner. Requires store management permission.

**Body**

```json
{
  "fullName": "Jane Supplier",
  "email": "jane@example.com",
  "phone": "+2348012345678",
  "jobTitle": "Export Lead",
  "role": "EXPORT_MANAGER",
  "isPrimary": true,
  "handlesImports": false,
  "handlesExports": true
}
```

`handlesImports` and `handlesExports` cannot both be false.

### PATCH `/api/marketplace/stores/:id/trade-partners/:tpid`

Update a trade partner. Requires store management permission.

Accepts create fields as optional, plus:

```json
{
  "isActive": true
}
```

### DELETE `/api/marketplace/stores/:id/trade-partners/:tpid`

Soft-delete a trade partner.

### GET `/api/marketplace/stores/:id/bank-accounts`

List active bank accounts for a store.

This endpoint is visible to authenticated marketplace users.

### GET `/api/marketplace/stores/:id/bank-accounts/:baid`

Fetch one active bank account for a store.

### POST `/api/marketplace/stores/:id/bank-accounts`

Create a bank account for a store. Only the store owner or org `OWNER`/`ADMIN` can create it.

The current schema allows one bank account per store.

**Body**

```json
{
  "accountNumber": "0123456789",
  "accountName": "Lagos Components Limited",
  "accountType": "CURRENT",
  "holderType": "BUSINESS",
  "bankName": "Example Bank",
  "bankCode": "044",
  "swiftBic": "EXAMPLLA",
  "countryCode": "NG",
  "currencyCode": "NGN",
  "routingMetadata": {
    "bank_code": "044"
  }
}
```

Required: `accountNumber`, `accountName`, `bankName`, `countryCode`, `currencyCode`.

`accountType` defaults to `CURRENT`. `holderType` defaults to `BUSINESS`. `routingMetadata` defaults to `{}`.

Country-specific `routingMetadata` rules:

| Country | Required metadata |
| --- | --- |
| `US` | `routing_number`, 9 digits |
| `NG` | `bank_code`, 3 digits |
| `Europe` | `iban`, non-empty string |

### PATCH `/api/marketplace/stores/:id/bank-accounts/:baid`

Update a bank account. Only the store owner or org `OWNER`/`ADMIN` can update it.

Accepts create fields as optional, plus:

```json
{
  "isActive": true
}
```

If `routingMetadata` is updated, it is validated against the supplied `countryCode` or the existing bank account country.

### DELETE `/api/marketplace/stores/:id/bank-accounts/:baid`

Soft-delete a bank account by setting `isActive` to false.

## Cargo API

Base path: `/api/cargo`

Cargo allocations are scoped to either the current user or active organization.

Organization users must be `OWNER`, `ADMIN`, or `OPS_MANAGER` to create, update, checkout, confirm, or cancel cargo allocations.

### POST `/api/cargo/allocation`

Create a draft cargo allocation.

**Body**

```json
{
  "storeId": "store_id",
  "currencyCode": "NGN",
  "deliveryAddress": {
    "country": "Nigeria",
    "city": "Abuja",
    "postal_code": "901108",
    "street": "45 street",
    "fullAddress": "45 strt, queen park estate, Abuja, Nigeria"
  },
  "items": [
    {
      "productId": "product_id",
      "quantity": 15,
      "quantityUnit": "UNIT"
    }
  ]
}
```

Required: `storeId`, `items`. `currencyCode` defaults to the store currency. Duplicate products are rejected. All products must belong to the store.

### GET `/api/cargo/allocation`

List scoped cargo allocations.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `status` | ShipmentStatus | Optional |
| `storeId` | string | Optional |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

### POST `/api/cargo/allocation/checkout`

Generate or update landed cost breakdown for a draft allocation. This does not create a payment intent. The allocation remains negotiable until confirmation.

**Body**

```json
{
  "allocationId": "cargo_allocation_id",
  "tariffRateBps": 500,
  "customsFeeMinor": 150000,
  "vatRateBps": 750,
  "otherFeeMinor": 0
}
```

Required: `allocationId`. Fee/rate fields are optional.

**Response data:** `LandedCostBreakdown`.

### POST `/api/cargo/allocation/:id/confirm`

Confirm a draft allocation after negotiation. Requires an existing landed cost breakdown. This creates a Kora payment intent and moves the allocation to `AWAITING_PAYMENT`.

**Response data:** `PaymentIntent` with `checkoutUrl`.

### GET `/api/cargo/allocation/:id`

Fetch a scoped cargo allocation.

### PATCH `/api/cargo/allocation/:id`

Update a draft cargo allocation. Only allowed while status is `DRAFT` and any attached cargo pool is still `DRAFT`.

**Body**

```json
{
  "storeId": "store_id",
  "currencyCode": "NGN",
  "deliveryAddress": {
    "country": "Nigeria",
    "city": "Abuja",
    "postal_code": "901108",
    "street": "45 street",
    "fullAddress": "45 strt, queen park estate, Abuja, Nigeria"
  },
  "items": [
    {
      "productId": "product_id",
      "quantity": 20,
      "quantityUnit": "UNIT"
    }
  ]
}
```

All fields are optional, but at least one must be provided.

### POST `/api/cargo/allocation/:id/cancel`

Cancel a cargo allocation unless the attached cargo pool is `CLOSED`. Pending payment intents are cancelled; paid intents are marked refunded.

## Payment API

Base path: `/api/payment`

### PATCH `/api/payment/breakdown`

Update an existing cost breakdown after negotiation and before confirmation.

Permissions:

- User-owned store: store owner.
- Organization-owned store: `OWNER`, `ADMIN`, or `FINANCE`.

Only allowed while the cargo allocation is still `DRAFT`.

**Body**

```json
{
  "cargoAllocationId": "cargo_allocation_id",
  "baseCostMinor": 277500000,
  "tariffRateBps": 500,
  "customsFeeMinor": 150000,
  "vatRateBps": 750,
  "otherFeeMinor": 0
}
```

Required: `cargoAllocationId` and at least one cost field.

The backend recalculates:

- `tariffAmountMinor`
- `vatAmountMinor`
- `totalAmountMinor`

### GET `/api/payment/intents/:id`

Fetch a scoped payment intent. Scope is based on the related cargo allocation owner/org.

### POST `/api/payment/intents/:id/cancel`

Cancel a pending or authorized payment intent and restore the related cargo allocation to `DRAFT`.

Not allowed if the related cargo pool is `CLOSED`.

### GET `/api/payment/escrow/:intentId`

Fetch escrow details for a scoped payment intent.

## Carrier API

Base path: `/api/carrier`

### GET `/api/carrier/map`

Fetch map data:

- all ports
- active vessels with telemetry coordinates
- current scoped shipments for the user/org based on cargo allocations

Requires authentication because shipment locations are scoped.

### GET `/api/carrier/vessels`

List active vessels.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `search` | string | Searches vessel name, IMO number, carrier name |
| `type` | VesselType | Optional |
| `carrierId` | string | Optional |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

### GET `/api/carrier/vessels/:id`

Fetch one active vessel with carrier, cargo pools, and recent shipments.

### GET `/api/carrier/ports`

List ports.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `search` | string | Searches port name and code |
| `countryCode` | string | 2-letter country code |
| `page` | number | Default `1` |
| `limit` | number | Default `50`, max `100` |

## Shipment API

Base path: `/api/shipment`

Shipments are scoped through cargo allocations in the shipment's cargo pool.

### GET `/api/shipment`

List shipments related to the current user/org.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `status` | ShipmentStatus | Optional |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

### GET `/api/shipment/:id`

Fetch one scoped shipment.

### POST `/api/shipment/:id/manifest`

Generate manifest document records for the scoped cargo allocations in a shipment.

Organization permission: `OWNER`, `ADMIN`, or `OPS_MANAGER`.

**Response data includes:**

- shipment summary
- cargo pool summary
- scoped cargo allocations
- shipment events
- manifest documents
- generated timestamp

### GET `/api/shipment/:id/manifest`

Fetch the generated manifest payload. Returns 404 if no manifest document has been generated.

### GET `/api/shipment/:id/download`

Download the generated manifest as JSON.

Response headers:

```http
Content-Type: application/json
Content-Disposition: attachment; filename="<referenceCode>-manifest.json"
```

## Messaging API

Base path: `/api/messaging`

Messaging is currently HTTP-only. The frontend should manually reload/poll for new messages until websockets are added.

Conversations happen between authenticated platform users and/or organization teams. Trade partners are not message participants.

Organization users must be `OWNER`, `ADMIN`, or `OPS_MANAGER` to use messaging while acting in an organization context.

### GET `/api/messaging/conversations`

List conversations available to the current user or active organization.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `status` | ConversationStatus | Optional |
| `storeId` | string | Optional |
| `productId` | string | Optional |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, max `100` |

### POST `/api/messaging/conversations`

Create a conversation for a store and create the first system/user messages.

The backend determines the responding side from the store:

- `store.userId` means the responder is a personal store owner.
- `store.organizationId` means the responder is that organization's ops team.

The requester is the active organization if `req.user.orgId` exists, otherwise the authenticated user.

**Body**

```json
{
  "storeId": "store_123",
  "productId": "product_123",
  "subject": "Need landing terms for telemetry nodes",
  "body": "Hello, can you confirm availability and shipping lead time?"
}
```

Required: `storeId`, `subject`, `body`.

`productId` is optional, but if supplied it must belong to the store.

The backend rejects attempts to start a conversation with your own store.

### GET `/api/messaging/conversations/:id`

Fetch a conversation if the current user or active organization is a participant.

### GET `/api/messaging/conversations/:id/messages`

Fetch messages in a conversation. This also updates the current participant's `lastReadAt`.

**Query**

| Name | Type | Notes |
| --- | --- | --- |
| `page` | number | Default `1` |
| `limit` | number | Default `50`, max `100` |

### POST `/api/messaging/conversations/:id/messages`

Send a message in an open conversation.

**Body**

```json
{
  "body": "Thanks. Please send the updated pricing."
}
```

### POST `/api/messaging/conversations/:id/close`

Close a conversation. Closed conversations cannot receive new messages.

## Frontend Integration Notes

### Recommended Request Helper

```ts
export async function apiFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw payload;
  }

  return payload as T;
}
```

### Suggested Cargo Checkout Flow

1. Create allocation:

```http
POST /api/cargo/allocation
```

2. Generate cost breakdown:

```http
POST /api/cargo/allocation/checkout
```

3. Optional supplier-side negotiated cost update:

```http
PATCH /api/payment/breakdown
```

4. Confirm allocation and receive payment checkout URL:

```http
POST /api/cargo/allocation/:id/confirm
```

5. Redirect user to `data.checkoutUrl` from the returned payment intent.

### Suggested Manifest Flow

1. List user/org shipments:

```http
GET /api/shipment
```

2. Generate manifest when allowed:

```http
POST /api/shipment/:id/manifest
```

3. Fetch or download manifest:

```http
GET /api/shipment/:id/manifest
GET /api/shipment/:id/download
```

### Suggested Messaging Flow

1. Start a store conversation:

```http
POST /api/messaging/conversations
```

2. List inbox conversations:

```http
GET /api/messaging/conversations?status=OPEN
```

3. Load messages:

```http
GET /api/messaging/conversations/:id/messages
```

4. Send a message:

```http
POST /api/messaging/conversations/:id/messages
```

5. Close the conversation when resolved:

```http
POST /api/messaging/conversations/:id/close
```

## Known Not-Yet-Implemented Areas

- Webhook endpoint handlers exist for Clerk/Kora, but they are backend-provider integrations rather than frontend APIs.
- Payment webhook processing and escrow creation logic are still incomplete.
- Actual file/PDF manifest generation is not implemented yet; current manifest download returns structured JSON.

## Example Response Data

The examples below focus on the `data` field returned by each endpoint. Actual IDs, dates, and generated values will differ.

### User Examples

#### GET `/api/user`

```json
{
  "id": "user_123",
  "firstName": "Ada",
  "lastName": "Okafor",
  "email": "ada@example.com",
  "phone": "+2348012345678",
  "profileImageUrl": "https://example.com/avatar.png",
  "createdAt": "2026-05-28T10:00:00.000Z",
  "updatedAt": "2026-05-28T10:00:00.000Z",
  "memberships": [
    {
      "id": "membership_id",
      "clerkMappingId": "orgmem_123",
      "role": "ADMIN",
      "userId": "user_123",
      "organizationId": "org_123",
      "organization": {
        "id": "org_123",
        "name": "Zeon Import Co",
        "countryCode": "NG",
        "baseCurrency": "NGN",
        "status": "ACTIVE"
      }
    }
  ],
  "stores": [],
  "notificationPreference": {
    "id": "pref_123",
    "userId": "user_123",
    "notifyEmail": true,
    "notifySms": false,
    "notifyCustomsHold": true,
    "notifyManifestReady": true
  }
}
```

#### PATCH `/api/user`

```json
{
  "id": "user_123",
  "firstName": "Ada",
  "lastName": "Okafor",
  "email": "ada@example.com",
  "phone": "+2348012345678",
  "profileImageUrl": "https://example.com/avatar.png",
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### GET `/api/user/settings/notifications`

```json
{
  "id": "pref_123",
  "organizationId": null,
  "userId": "user_123",
  "notifyEmail": true,
  "notifySms": false,
  "notifyCustomsHold": true,
  "notifyManifestReady": true,
  "createdAt": "2026-05-28T10:00:00.000Z",
  "updatedAt": "2026-05-28T10:00:00.000Z"
}
```

#### PATCH `/api/user/settings/notifications`

```json
{
  "id": "pref_123",
  "userId": "user_123",
  "notifyEmail": true,
  "notifySms": true,
  "notifyCustomsHold": true,
  "notifyManifestReady": false,
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

### Marketplace Examples

#### GET `/api/marketplace/stores`

```json
{
  "stores": [
    {
      "id": "store_123",
      "name": "Lagos Components",
      "slug": "lagos-components",
      "countryCode": "NG",
      "city": "Lagos",
      "category": "ELECTRONICS",
      "logoUrl": "https://example.com/logo.png",
      "verificationBadge": "TOP_VERIFIED",
      "reliabilityScore": "92.5",
      "minimumOrderAmountMinor": "5000000",
      "currencyCode": "NGN",
      "isActive": true,
      "user": {
        "id": "user_123",
        "firstName": "Ada",
        "lastName": "Okafor",
        "email": "ada@example.com",
        "profileImageUrl": "https://example.com/avatar.png"
      },
      "organization": null,
      "products": [],
      "tradePartners": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### POST `/api/marketplace/stores`

```json
{
  "id": "store_123",
  "userId": "user_123",
  "organizationId": null,
  "name": "Lagos Components",
  "slug": "lagos-components",
  "countryCode": "NG",
  "city": "Lagos",
  "category": "ELECTRONICS",
  "currencyCode": "NGN",
  "isActive": true,
  "products": [],
  "tradePartners": []
}
```

#### GET `/api/marketplace/stores/:id`

```json
{
  "id": "store_123",
  "name": "Lagos Components",
  "slug": "lagos-components",
  "countryCode": "NG",
  "city": "Lagos",
  "category": "ELECTRONICS",
  "currencyCode": "NGN",
  "products": [
    {
      "id": "product_123",
      "name": "Wireless Telemetry Node",
      "priceAmountMinor": "18500000",
      "currencyCode": "NGN",
      "pricingUnit": "UNIT"
    }
  ],
  "tradePartners": [
    {
      "id": "partner_123",
      "fullName": "Jane Supplier",
      "email": "jane@example.com",
      "isPrimary": true
    }
  ]
}
```

#### PATCH `/api/marketplace/stores/:id`

```json
{
  "id": "store_123",
  "name": "Lagos Components Updated",
  "slug": "lagos-components",
  "city": "Lagos",
  "category": "ELECTRONICS",
  "currencyCode": "NGN",
  "isActive": true,
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### DELETE `/api/marketplace/stores/:id`

This endpoint returns no `data` field.

```json
{
  "message": "Store deleted successfully",
  "status": true
}
```

#### GET `/api/marketplace/stores/:id/products`

```json
{
  "products": [
    {
      "id": "product_123",
      "storeId": "store_123",
      "name": "Wireless Telemetry Node",
      "description": "Industrial telemetry hardware",
      "sku": "WTN-001",
      "priceAmountMinor": "18500000",
      "currencyCode": "NGN",
      "pricingUnit": "UNIT",
      "moqValue": "10",
      "moqUnit": "UNIT",
      "imageUrl": "https://example.com/product.png",
      "isActive": true,
      "store": {
        "id": "store_123",
        "name": "Lagos Components"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### POST `/api/marketplace/stores/:id/products`

```json
{
  "id": "product_123",
  "storeId": "store_123",
  "name": "Wireless Telemetry Node",
  "description": "Industrial telemetry hardware",
  "sku": "WTN-001",
  "priceAmountMinor": "18500000",
  "currencyCode": "NGN",
  "pricingUnit": "UNIT",
  "moqValue": "10",
  "moqUnit": "UNIT",
  "imageUrl": "https://example.com/product.png",
  "isActive": true,
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  }
}
```

#### GET `/api/marketplace/stores/:id/products/:pid`

```json
{
  "id": "product_123",
  "storeId": "store_123",
  "name": "Wireless Telemetry Node",
  "priceAmountMinor": "18500000",
  "currencyCode": "NGN",
  "pricingUnit": "UNIT",
  "moqValue": "10",
  "moqUnit": "UNIT",
  "isActive": true,
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  }
}
```

#### PATCH `/api/marketplace/stores/:id/products/:pid`

```json
{
  "id": "product_123",
  "name": "Wireless Telemetry Node V2",
  "priceAmountMinor": "19000000",
  "currencyCode": "NGN",
  "pricingUnit": "UNIT",
  "isActive": true,
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### DELETE `/api/marketplace/stores/:id/products/:pid`

This endpoint returns no `data` field.

```json
{
  "message": "Product deleted successfully",
  "status": true
}
```

#### GET `/api/marketplace/stores/:id/trade-partners`

```json
[
  {
    "id": "partner_123",
    "storeId": "store_123",
    "fullName": "Jane Supplier",
    "email": "jane@example.com",
    "phone": "+2348012345678",
    "jobTitle": "Export Lead",
    "role": "EXPORT_MANAGER",
    "isPrimary": true,
    "handlesImports": false,
    "handlesExports": true,
    "isActive": true,
    "store": {
      "id": "store_123",
      "name": "Lagos Components"
    }
  }
]
```

#### GET `/api/marketplace/stores/:id/trade-partners/:tpid`

```json
{
  "id": "partner_123",
  "storeId": "store_123",
  "fullName": "Jane Supplier",
  "email": "jane@example.com",
  "role": "EXPORT_MANAGER",
  "isPrimary": true,
  "handlesExports": true,
  "isActive": true,
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  }
}
```

#### POST `/api/marketplace/stores/:id/trade-partners`

```json
{
  "id": "partner_123",
  "storeId": "store_123",
  "organizationId": null,
  "fullName": "Jane Supplier",
  "email": "jane@example.com",
  "phone": "+2348012345678",
  "jobTitle": "Export Lead",
  "role": "EXPORT_MANAGER",
  "isPrimary": true,
  "handlesImports": false,
  "handlesExports": true,
  "isActive": true
}
```

#### PATCH `/api/marketplace/stores/:id/trade-partners/:tpid`

```json
{
  "id": "partner_123",
  "fullName": "Jane Supplier",
  "email": "jane@example.com",
  "isPrimary": false,
  "handlesImports": true,
  "handlesExports": true,
  "isActive": true,
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### DELETE `/api/marketplace/stores/:id/trade-partners/:tpid`

This endpoint returns no `data` field.

```json
{
  "message": "Trade partner deleted successfully",
  "status": true
}
```

#### GET `/api/marketplace/stores/:id/bank-accounts`

```json
[
  {
    "id": "bank_account_123",
    "storeId": "store_123",
    "accountNumber": "0123456789",
    "accountName": "Lagos Components Limited",
    "accountType": "CURRENT",
    "holderType": "BUSINESS",
    "bankName": "Example Bank",
    "bankCode": "044",
    "swiftBic": "EXAMPLLA",
    "countryCode": "NG",
    "currencyCode": "NGN",
    "routingMetadata": {
      "bank_code": "044"
    },
    "isActive": true,
    "createdAt": "2026-06-04T09:00:00.000Z",
    "updatedAt": "2026-06-04T09:00:00.000Z",
    "store": {
      "id": "store_123",
      "name": "Lagos Components"
    }
  }
]
```

#### GET `/api/marketplace/stores/:id/bank-accounts/:baid`

```json
{
  "id": "bank_account_123",
  "storeId": "store_123",
  "accountNumber": "0123456789",
  "accountName": "Lagos Components Limited",
  "accountType": "CURRENT",
  "holderType": "BUSINESS",
  "bankName": "Example Bank",
  "bankCode": "044",
  "swiftBic": "EXAMPLLA",
  "countryCode": "NG",
  "currencyCode": "NGN",
  "routingMetadata": {
    "bank_code": "044"
  },
  "isActive": true,
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  }
}
```

#### POST `/api/marketplace/stores/:id/bank-accounts`

```json
{
  "id": "bank_account_123",
  "storeId": "store_123",
  "accountNumber": "0123456789",
  "accountName": "Lagos Components Limited",
  "accountType": "CURRENT",
  "holderType": "BUSINESS",
  "bankName": "Example Bank",
  "bankCode": "044",
  "swiftBic": "EXAMPLLA",
  "countryCode": "NG",
  "currencyCode": "NGN",
  "routingMetadata": {
    "bank_code": "044"
  },
  "isActive": true,
  "createdAt": "2026-06-04T09:00:00.000Z",
  "updatedAt": "2026-06-04T09:00:00.000Z",
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  }
}
```

#### PATCH `/api/marketplace/stores/:id/bank-accounts/:baid`

```json
{
  "id": "bank_account_123",
  "storeId": "store_123",
  "accountNumber": "DE89370400440532013000",
  "accountName": "Lagos Components EU Settlement",
  "accountType": "CURRENT",
  "holderType": "BUSINESS",
  "bankName": "Example EU Bank",
  "bankCode": null,
  "swiftBic": "DEUTDEFF",
  "countryCode": "DE",
  "currencyCode": "EUR",
  "routingMetadata": {
    "iban": "DE89370400440532013000"
  },
  "isActive": true,
  "updatedAt": "2026-06-04T09:30:00.000Z",
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  }
}
```

#### DELETE `/api/marketplace/stores/:id/bank-accounts/:baid`

This endpoint returns no `data` field.

```json
{
  "message": "Bank account deleted successfully",
  "status": true
}
```

### Cargo Examples

#### POST `/api/cargo/allocation`

```json
{
  "id": "allocation_123",
  "organizationId": null,
  "cargoPoolId": null,
  "storeId": "store_123",
  "status": "DRAFT",
  "quotedAmountMinor": null,
  "finalAmountMinor": null,
  "currencyCode": "NGN",
  "deliveryAddress": {
    "country": "Nigeria",
    "city": "Abuja",
    "postal_code": "901108",
    "street": "45 street",
    "fullAddress": "45 strt, queen park estate, Abuja, Nigeria"
  },
  "createdByUserId": "user_123",
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  },
  "items": [
    {
      "id": "allocation_item_123",
      "cargoAllocationId": "allocation_123",
      "productId": "product_123",
      "quantity": "15",
      "quantityUnit": "UNIT",
      "product": {
        "id": "product_123",
        "name": "Wireless Telemetry Node",
        "priceAmountMinor": "18500000"
      }
    }
  ],
  "landedCostBreakdown": null,
  "paymentIntents": []
}
```

#### GET `/api/cargo/allocation`

```json
{
  "cargoAllocations": [
    {
      "id": "allocation_123",
      "status": "DRAFT",
      "currencyCode": "NGN",
      "deliveryAddress": {
        "country": "Nigeria",
        "city": "Abuja",
        "postal_code": "901108",
        "street": "45 street",
        "fullAddress": "45 strt, queen park estate, Abuja, Nigeria"
      },
      "store": {
        "id": "store_123",
        "name": "Lagos Components"
      },
      "items": [],
      "landedCostBreakdown": null,
      "paymentIntents": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### POST `/api/cargo/allocation/checkout`

```json
{
  "id": "breakdown_123",
  "cargoAllocationId": "allocation_123",
  "baseCostMinor": "277500000",
  "tariffRateBps": 500,
  "tariffAmountMinor": "13875000",
  "customsFeeMinor": "150000",
  "vatRateBps": 750,
  "vatAmountMinor": "21864375",
  "otherFeeMinor": "0",
  "totalAmountMinor": "313389375",
  "currencyCode": "NGN"
}
```

#### POST `/api/cargo/allocation/:id/confirm`

```json
{
  "id": "payment_intent_123",
  "userId": "user_123",
  "organizationId": null,
  "cargoAllocationId": "allocation_123",
  "provider": "KORA",
  "providerReference": "z-reference",
  "amountMinor": "313389375",
  "currencyCode": "NGN",
  "status": "PENDING",
  "checkoutUrl": "https://checkout.korapay.com/pay/z-reference",
  "cargoAllocation": {
    "id": "allocation_123",
    "status": "AWAITING_PAYMENT",
    "landedCostBreakdown": {
      "totalAmountMinor": "313389375"
    }
  },
  "escrowRecord": null
}
```

#### GET `/api/cargo/allocation/:id`

```json
{
  "id": "allocation_123",
  "status": "AWAITING_PAYMENT",
  "currencyCode": "NGN",
  "deliveryAddress": {
    "country": "Nigeria",
    "city": "Abuja",
    "postal_code": "901108",
    "street": "45 street",
    "fullAddress": "45 strt, queen park estate, Abuja, Nigeria"
  },
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  },
  "items": [],
  "landedCostBreakdown": {
    "id": "breakdown_123",
    "totalAmountMinor": "313389375"
  },
  "paymentIntents": [
    {
      "id": "payment_intent_123",
      "status": "PENDING",
      "checkoutUrl": "https://checkout.korapay.com/pay/z-reference"
    }
  ]
}
```

#### PATCH `/api/cargo/allocation/:id`

```json
{
  "id": "allocation_123",
  "status": "DRAFT",
  "currencyCode": "NGN",
  "deliveryAddress": {
    "country": "Nigeria",
    "city": "Abuja",
    "postal_code": "901108",
    "street": "45 street",
    "fullAddress": "45 strt, queen park estate, Abuja, Nigeria"
  },
  "items": [
    {
      "id": "allocation_item_456",
      "productId": "product_456",
      "quantity": "20",
      "quantityUnit": "UNIT"
    }
  ],
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### POST `/api/cargo/allocation/:id/cancel`

```json
{
  "id": "allocation_123",
  "status": "CANCELLED",
  "paymentIntents": [
    {
      "id": "payment_intent_123",
      "status": "CANCELLED"
    }
  ]
}
```

### Payment Examples

#### PATCH `/api/payment/breakdown`

```json
{
  "id": "breakdown_123",
  "cargoAllocationId": "allocation_123",
  "baseCostMinor": "270000000",
  "tariffRateBps": 500,
  "tariffAmountMinor": "13500000",
  "customsFeeMinor": "150000",
  "vatRateBps": 750,
  "vatAmountMinor": "21273750",
  "otherFeeMinor": "0",
  "totalAmountMinor": "304923750",
  "currencyCode": "NGN",
  "updatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### GET `/api/payment/intents/:id`

```json
{
  "id": "payment_intent_123",
  "provider": "KORA",
  "providerReference": "z-reference",
  "amountMinor": "304923750",
  "currencyCode": "NGN",
  "status": "PENDING",
  "checkoutUrl": "https://checkout.korapay.com/pay/z-reference",
  "cargoAllocation": {
    "id": "allocation_123",
    "status": "AWAITING_PAYMENT",
    "store": {
      "id": "store_123",
      "name": "Lagos Components"
    },
    "landedCostBreakdown": {
      "id": "breakdown_123",
      "totalAmountMinor": "304923750"
    }
  },
  "escrowRecord": null
}
```

#### POST `/api/payment/intents/:id/cancel`

```json
{
  "id": "payment_intent_123",
  "status": "CANCELLED",
  "cargoAllocation": {
    "id": "allocation_123",
    "status": "DRAFT"
  }
}
```

#### GET `/api/payment/escrow/:intentId`

```json
{
  "id": "escrow_123",
  "paymentIntentId": "payment_intent_123",
  "status": "HOLDING",
  "heldAmountMinor": "304923750",
  "releasedAmountMinor": "0",
  "releasedAt": null,
  "releaseCondition": "Release after delivery confirmation",
  "paymentIntent": {
    "id": "payment_intent_123",
    "status": "PAID",
    "cargoAllocation": {
      "id": "allocation_123"
    }
  }
}
```

### Carrier Examples

#### GET `/api/carrier/map`

```json
{
  "ports": [
    {
      "id": "port_123",
      "code": "NGLOS",
      "name": "Port of Lagos",
      "countryCode": "NG",
      "lat": "6.450000",
      "lng": "3.390000"
    }
  ],
  "vessels": [
    {
      "id": "vessel_123",
      "name": "Atlantic Pioneer",
      "type": "SHIP",
      "currentLat": "5.900000",
      "currentLng": "2.900000",
      "currentHeadingDegrees": "82.00",
      "carrier": {
        "id": "carrier_123",
        "name": "Atlantic Freight"
      }
    }
  ],
  "shipments": [
    {
      "id": "shipment_123",
      "referenceCode": "SHP-001",
      "status": "IN_TRANSIT",
      "originPort": {
        "name": "Port of Rotterdam"
      },
      "destinationPort": {
        "name": "Port of Lagos"
      },
      "vessel": {
        "name": "Atlantic Pioneer"
      }
    }
  ]
}
```

#### GET `/api/carrier/vessels`

```json
{
  "vessels": [
    {
      "id": "vessel_123",
      "carrierId": "carrier_123",
      "name": "Atlantic Pioneer",
      "imoNumber": "IMO1234567",
      "type": "SHIP",
      "capacityTeu": 8000,
      "currentLoadTeu": 4200,
      "utilizationPercent": "52.50",
      "avgSpeedKnots": "18.20",
      "isActive": true,
      "carrier": {
        "id": "carrier_123",
        "name": "Atlantic Freight"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### GET `/api/carrier/vessels/:id`

```json
{
  "id": "vessel_123",
  "name": "Atlantic Pioneer",
  "type": "SHIP",
  "capacityTeu": 8000,
  "currentLat": "5.900000",
  "currentLng": "2.900000",
  "carrier": {
    "id": "carrier_123",
    "name": "Atlantic Freight",
    "insuranceStatus": "COVERED",
    "verificationStatus": "VERIFIED"
  },
  "cargoPools": [],
  "shipments": []
}
```

#### GET `/api/carrier/ports`

```json
{
  "ports": [
    {
      "id": "port_123",
      "code": "NGLOS",
      "name": "Port of Lagos",
      "countryCode": "NG",
      "lat": "6.450000",
      "lng": "3.390000"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

### Shipment Examples

#### GET `/api/shipment`

```json
{
  "shipments": [
    {
      "id": "shipment_123",
      "cargoPoolId": "pool_123",
      "referenceCode": "SHP-001",
      "status": "IN_TRANSIT",
      "originPort": {
        "id": "port_origin",
        "name": "Port of Rotterdam"
      },
      "destinationPort": {
        "id": "port_destination",
        "name": "Port of Lagos"
      },
      "carrier": {
        "id": "carrier_123",
        "name": "Atlantic Freight"
      },
      "vessel": {
        "id": "vessel_123",
        "name": "Atlantic Pioneer"
      },
      "cargoPool": {
        "id": "pool_123",
        "cargoAllocations": []
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### GET `/api/shipment/:id`

```json
{
  "id": "shipment_123",
  "cargoPoolId": "pool_123",
  "referenceCode": "SHP-001",
  "status": "IN_TRANSIT",
  "originPort": {
    "name": "Port of Rotterdam"
  },
  "destinationPort": {
    "name": "Port of Lagos"
  },
  "shipmentEvents": [
    {
      "id": "event_123",
      "eventType": "DEPARTED_ORIGIN",
      "occurredAt": "2026-06-01T09:00:00.000Z",
      "source": "CARRIER"
    }
  ],
  "cargoPool": {
    "id": "pool_123",
    "cargoAllocations": [
      {
        "id": "allocation_123",
        "store": {
          "name": "Lagos Components"
        },
        "items": []
      }
    ]
  }
}
```

#### POST `/api/shipment/:id/manifest`

```json
{
  "shipment": {
    "id": "shipment_123",
    "referenceCode": "SHP-001",
    "status": "IN_TRANSIT",
    "originPort": {
      "name": "Port of Rotterdam"
    },
    "destinationPort": {
      "name": "Port of Lagos"
    }
  },
  "cargoPool": {
    "id": "pool_123",
    "status": "CLOSED",
    "departureEtaAt": "2026-06-01T09:00:00.000Z",
    "arrivalEtaAt": "2026-06-10T09:00:00.000Z"
  },
  "cargoAllocations": [
    {
      "id": "allocation_123",
      "store": {
        "name": "Lagos Components"
      },
      "items": []
    }
  ],
  "events": [],
  "documents": [
    {
      "id": "manifest_123",
      "shipmentId": "shipment_123",
      "cargoAllocationId": "allocation_123",
      "documentType": "MANIFEST",
      "storageKey": "manifests/SHP-001/allocation_123.json",
      "mimeType": "application/json",
      "generatedAt": "2026-06-02T09:00:00.000Z"
    }
  ],
  "generatedAt": "2026-06-02T09:00:00.000Z"
}
```

#### GET `/api/shipment/:id/manifest`

Returns the same payload shape as `POST /api/shipment/:id/manifest`.

#### GET `/api/shipment/:id/download`

Returns the same manifest JSON payload as a downloadable file, not wrapped in `{ message, status, data }`.

### Messaging Examples

#### GET `/api/messaging/conversations`

```json
{
  "conversations": [
    {
      "id": "conversation_123",
      "storeId": "store_123",
      "productId": "product_123",
      "subject": "Need landing terms for telemetry nodes",
      "status": "OPEN",
      "lastMessageAt": "2026-06-04T09:00:00.000Z",
      "store": {
        "id": "store_123",
        "name": "Lagos Components",
        "slug": "lagos-components"
      },
      "product": {
        "id": "product_123",
        "name": "Wireless Telemetry Node"
      },
      "participants": [
        {
          "id": "participant_123",
          "conversationId": "conversation_123",
          "userId": "user_123",
          "organizationId": null,
          "role": "REQUESTER",
          "lastReadAt": "2026-06-04T09:00:00.000Z",
          "user": {
            "id": "user_123",
            "firstName": "Ada",
            "lastName": "Okafor",
            "email": "ada@example.com",
            "profileImageUrl": "https://example.com/avatar.png"
          },
          "organization": null
        },
        {
          "id": "participant_456",
          "conversationId": "conversation_123",
          "userId": null,
          "organizationId": "org_123",
          "role": "RESPONDER",
          "lastReadAt": null,
          "user": null,
          "organization": {
            "id": "org_123",
            "name": "Zeon Import Co",
            "countryCode": "NG",
            "baseCurrency": "NGN",
            "status": "ACTIVE"
          }
        }
      ],
      "messages": [
        {
          "id": "message_latest",
          "conversationId": "conversation_123",
          "senderType": "USER",
          "senderUserId": "user_123",
          "direction": "OUTBOUND",
          "body": "Hello, can you confirm availability?",
          "sentAt": "2026-06-04T09:00:00.000Z",
          "readAt": null
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

#### POST `/api/messaging/conversations`

```json
{
  "id": "conversation_123",
  "storeId": "store_123",
  "productId": "product_123",
  "subject": "Need landing terms for telemetry nodes",
  "status": "OPEN",
  "lastMessageAt": "2026-06-04T09:00:00.000Z",
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  },
  "product": {
    "id": "product_123",
    "name": "Wireless Telemetry Node"
  },
  "participants": [
    {
      "id": "participant_123",
      "role": "REQUESTER",
      "userId": "user_123",
      "organizationId": null
    },
    {
      "id": "participant_456",
      "role": "RESPONDER",
      "userId": null,
      "organizationId": "org_123"
    }
  ],
  "messages": [
    {
      "id": "message_user",
      "senderType": "USER",
      "senderUserId": "user_123",
      "direction": "OUTBOUND",
      "body": "Hello, can you confirm availability and shipping lead time?",
      "sentAt": "2026-06-04T09:00:00.000Z"
    }
  ]
}
```

The create response includes only the latest message because the standard conversation include returns `messages` with `take: 1`.

#### GET `/api/messaging/conversations/:id`

```json
{
  "id": "conversation_123",
  "storeId": "store_123",
  "productId": "product_123",
  "subject": "Need landing terms for telemetry nodes",
  "status": "OPEN",
  "lastMessageAt": "2026-06-04T09:00:00.000Z",
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  },
  "product": {
    "id": "product_123",
    "name": "Wireless Telemetry Node"
  },
  "participants": [
    {
      "id": "participant_123",
      "role": "REQUESTER",
      "user": {
        "id": "user_123",
        "email": "ada@example.com"
      },
      "organization": null
    },
    {
      "id": "participant_456",
      "role": "RESPONDER",
      "user": null,
      "organization": {
        "id": "org_123",
        "name": "Zeon Import Co"
      }
    }
  ],
  "messages": [
    {
      "id": "message_latest",
      "senderType": "USER",
      "body": "Hello, can you confirm availability?",
      "sentAt": "2026-06-04T09:00:00.000Z"
    }
  ]
}
```

#### GET `/api/messaging/conversations/:id/messages`

```json
{
  "messages": [
    {
      "id": "message_system",
      "conversationId": "conversation_123",
      "senderType": "SYSTEM",
      "senderUserId": null,
      "direction": "SYSTEM",
      "body": "Conversation started.",
      "sentAt": "2026-06-04T09:00:00.000Z",
      "readAt": null,
      "senderUser": null
    },
    {
      "id": "message_user",
      "conversationId": "conversation_123",
      "senderType": "USER",
      "senderUserId": "user_123",
      "direction": "OUTBOUND",
      "body": "Hello, can you confirm availability and shipping lead time?",
      "sentAt": "2026-06-04T09:00:00.000Z",
      "readAt": null,
      "senderUser": {
        "id": "user_123",
        "firstName": "Ada",
        "lastName": "Okafor",
        "email": "ada@example.com",
        "profileImageUrl": "https://example.com/avatar.png"
      }
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 50
}
```

#### POST `/api/messaging/conversations/:id/messages`

```json
{
  "id": "message_789",
  "conversationId": "conversation_123",
  "senderType": "USER",
  "senderUserId": "user_456",
  "direction": "OUTBOUND",
  "body": "Thanks. Please send the updated pricing.",
  "sentAt": "2026-06-04T09:10:00.000Z",
  "readAt": null,
  "senderUser": {
    "id": "user_456",
    "firstName": "Tunde",
    "lastName": "Adebayo",
    "email": "tunde@example.com",
    "profileImageUrl": null
  }
}
```

#### POST `/api/messaging/conversations/:id/close`

```json
{
  "id": "conversation_123",
  "storeId": "store_123",
  "productId": "product_123",
  "subject": "Need landing terms for telemetry nodes",
  "status": "CLOSED",
  "lastMessageAt": "2026-06-04T09:10:00.000Z",
  "store": {
    "id": "store_123",
    "name": "Lagos Components"
  },
  "product": {
    "id": "product_123",
    "name": "Wireless Telemetry Node"
  },
  "participants": [],
  "messages": []
}
```
