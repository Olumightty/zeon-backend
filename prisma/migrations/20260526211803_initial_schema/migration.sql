-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'OPS_MANAGER', 'FINANCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "StoreCategory" AS ENUM ('ELECTRONICS', 'APPAREL', 'MACHINERY', 'ECO_GOODS', 'FOOD_AND_AG', 'AUTOMOTIVE', 'DECOR', 'COSMETICS', 'LOGISTICS');

-- CreateEnum
CREATE TYPE "VerificationBadge" AS ENUM ('TOP_VERIFIED', 'ECO_CERTIFIED', 'PREMIUM_QUALITY', 'ISO_COMPLIANT', 'TIER_1_SUPPLY');

-- CreateEnum
CREATE TYPE "TradePartnerRole" AS ENUM ('IMPORT_MANAGER', 'EXPORT_MANAGER', 'TRADE_COORDINATOR', 'WAREHOUSE_MANAGER', 'SALES_REP');

-- CreateEnum
CREATE TYPE "TradeRelationshipType" AS ENUM ('SUPPLIER', 'BUYER', 'BOTH', 'LOGISTICS_PARTNER');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'ARCHIVED', 'PENDING');

-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('COVERED', 'PENDING', 'EXPIRED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "VesselType" AS ENUM ('SHIP', 'PLANE', 'TRUCK', 'TRAIN');

-- CreateEnum
CREATE TYPE "CargoPoolStatus" AS ENUM ('DRAFT', 'OPEN', 'RESERVED', 'FULL', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFT', 'PENDING_POOLING', 'POOLED', 'BOOKED', 'AWAITING_PAYMENT', 'ESCROW_HELD', 'DEPARTED_ORIGIN', 'IN_TRANSIT', 'ARRIVED_DESTINATION', 'CUSTOMS_HOLD', 'CUSTOMS_RELEASED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('NOT_STARTED', 'HOLDING', 'PARTIALLY_RELEASED', 'RELEASED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('OUTBOUND', 'INBOUND', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('USER', 'TRADE_PARTNER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PricingUnit" AS ENUM ('UNIT', 'METER', 'KILOGRAM', 'LITER', 'TON', 'SHEET', 'SLOT', 'CONTAINER', 'CARTON', 'PACK');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('MANIFEST', 'RECEIPT', 'INVOICE', 'BILL_OF_LADING', 'CUSTOMS_CLEARANCE');

-- CreateEnum
CREATE TYPE "WebhookEventType" AS ENUM ('CARGO_ALLOCATION_CREATED', 'PAYMENT_PAID', 'ESCROW_HOLDING', 'SHIPMENT_STATUS_CHANGED', 'SHIPMENT_CUSTOMS_HOLD', 'SHIPMENT_CUSTOMS_RELEASED', 'MANIFEST_READY');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'LOGIN', 'LOGOUT', 'PAYMENT_EVENT', 'WEBHOOK_EVENT');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('SYSTEM', 'USER', 'CARRIER', 'PAYMENT_PROVIDER', 'WEBHOOK');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "countryCode" CHAR(2) NOT NULL,
    "baseCurrency" CHAR(3) NOT NULL,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "city" TEXT NOT NULL,
    "category" "StoreCategory" NOT NULL,
    "logoUrl" TEXT,
    "verificationBadge" "VerificationBadge",
    "reliabilityScore" DECIMAL(5,2),
    "minimumOrderAmountMinor" BIGINT,
    "currencyCode" CHAR(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "priceAmountMinor" BIGINT NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "pricingUnit" "PricingUnit" NOT NULL,
    "moqValue" DECIMAL(18,4) NOT NULL,
    "moqUnit" "PricingUnit" NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_partners" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "jobTitle" TEXT,
    "role" "TradePartnerRole",
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "handlesImports" BOOLEAN NOT NULL DEFAULT false,
    "handlesExports" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_relationships" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "counterpartyOrganizationId" TEXT NOT NULL,
    "relationshipType" "TradeRelationshipType" NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "insuranceStatus" "InsuranceStatus" NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessels" (
    "id" TEXT NOT NULL,
    "carrierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imoNumber" TEXT,
    "type" "VesselType" NOT NULL,
    "capacityTeu" INTEGER NOT NULL,
    "currentLoadTeu" INTEGER,
    "utilizationPercent" DECIMAL(5,2),
    "avgSpeedKnots" DECIMAL(6,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentLat" DECIMAL(9,6),
    "currentLng" DECIMAL(9,6),
    "currentHeadingDegrees" DECIMAL(6,2),
    "lastTelemetryAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ports" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "lat" DECIMAL(9,6) NOT NULL,
    "lng" DECIMAL(9,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_routes" (
    "id" TEXT NOT NULL,
    "originPortId" TEXT NOT NULL,
    "destinationPortId" TEXT NOT NULL,
    "checkpointsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_pools" (
    "id" TEXT NOT NULL,
    "routeId" TEXT,
    "vesselId" TEXT,
    "departurePortId" TEXT NOT NULL,
    "arrivalPortId" TEXT NOT NULL,
    "departureEtaAt" TIMESTAMP(3),
    "arrivalEtaAt" TIMESTAMP(3),
    "totalCapacityUnits" DECIMAL(18,4) NOT NULL,
    "reservedCapacityUnits" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "status" "CargoPoolStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_allocations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cargoPoolId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "quantityUnit" "PricingUnit" NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING_POOLING',
    "quotedAmountMinor" BIGINT,
    "finalAmountMinor" BIGINT,
    "currencyCode" CHAR(3) NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "cargoPoolId" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL,
    "originPortId" TEXT NOT NULL,
    "destinationPortId" TEXT NOT NULL,
    "carrierId" TEXT,
    "vesselId" TEXT,
    "bookedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "portId" TEXT,
    "notes" TEXT,
    "metadataJson" JSONB,
    "source" "EventSource" NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landed_cost_breakdowns" (
    "id" TEXT NOT NULL,
    "cargoAllocationId" TEXT NOT NULL,
    "baseCostMinor" BIGINT NOT NULL,
    "tariffRateBps" INTEGER NOT NULL,
    "tariffAmountMinor" BIGINT NOT NULL,
    "customsFeeMinor" BIGINT NOT NULL,
    "vatRateBps" INTEGER NOT NULL,
    "vatAmountMinor" BIGINT NOT NULL,
    "otherFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "totalAmountMinor" BIGINT NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landed_cost_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_intents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cargoAllocationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "amountMinor" BIGINT NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_records" (
    "id" TEXT NOT NULL,
    "paymentIntentId" TEXT NOT NULL,
    "status" "EscrowStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "heldAmountMinor" BIGINT NOT NULL,
    "releasedAmountMinor" BIGINT NOT NULL DEFAULT 0,
    "releasedAt" TIMESTAMP(3),
    "releaseCondition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest_documents" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT,
    "cargoAllocationId" TEXT,
    "documentType" "DocumentType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifest_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "counterpartyOrganizationId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT,
    "tradePartnerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderType" "MessageSenderType" NOT NULL,
    "senderUserId" TEXT,
    "senderTradePartnerId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT false,
    "notifyCustomsHold" BOOLEAN NOT NULL DEFAULT true,
    "notifyManifestReady" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedEvents" "WebhookEventType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookEndpointId" TEXT NOT NULL,
    "eventType" "WebhookEventType" NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "responseStatusCode" INTEGER,
    "responseBody" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_registrationNumber_key" ON "organizations"("registrationNumber");

-- CreateIndex
CREATE INDEX "organizations_countryCode_idx" ON "organizations"("countryCode");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_organizationId_idx" ON "stores"("organizationId");

-- CreateIndex
CREATE INDEX "stores_category_idx" ON "stores"("category");

-- CreateIndex
CREATE INDEX "stores_countryCode_city_idx" ON "stores"("countryCode", "city");

-- CreateIndex
CREATE INDEX "stores_isActive_idx" ON "stores"("isActive");

-- CreateIndex
CREATE INDEX "products_storeId_idx" ON "products"("storeId");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "products_storeId_sku_key" ON "products"("storeId", "sku");

-- CreateIndex
CREATE INDEX "trade_partners_organizationId_idx" ON "trade_partners"("organizationId");

-- CreateIndex
CREATE INDEX "trade_partners_storeId_idx" ON "trade_partners"("storeId");

-- CreateIndex
CREATE INDEX "trade_partners_storeId_isPrimary_idx" ON "trade_partners"("storeId", "isPrimary");

-- CreateIndex
CREATE INDEX "trade_partners_isActive_idx" ON "trade_partners"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "trade_partners_storeId_email_key" ON "trade_partners"("storeId", "email");

-- CreateIndex
CREATE INDEX "trade_relationships_counterpartyOrganizationId_idx" ON "trade_relationships"("counterpartyOrganizationId");

-- CreateIndex
CREATE INDEX "trade_relationships_status_idx" ON "trade_relationships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trade_relationships_organizationId_counterpartyOrganization_key" ON "trade_relationships"("organizationId", "counterpartyOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_name_key" ON "carriers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_imoNumber_key" ON "vessels"("imoNumber");

-- CreateIndex
CREATE INDEX "vessels_carrierId_idx" ON "vessels"("carrierId");

-- CreateIndex
CREATE INDEX "vessels_isActive_idx" ON "vessels"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_carrierId_name_key" ON "vessels"("carrierId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ports_code_key" ON "ports"("code");

-- CreateIndex
CREATE INDEX "ports_countryCode_idx" ON "ports"("countryCode");

-- CreateIndex
CREATE INDEX "shipment_routes_originPortId_idx" ON "shipment_routes"("originPortId");

-- CreateIndex
CREATE INDEX "shipment_routes_destinationPortId_idx" ON "shipment_routes"("destinationPortId");

-- CreateIndex
CREATE INDEX "cargo_pools_routeId_idx" ON "cargo_pools"("routeId");

-- CreateIndex
CREATE INDEX "cargo_pools_vesselId_idx" ON "cargo_pools"("vesselId");

-- CreateIndex
CREATE INDEX "cargo_pools_status_idx" ON "cargo_pools"("status");

-- CreateIndex
CREATE INDEX "cargo_pools_departurePortId_arrivalPortId_idx" ON "cargo_pools"("departurePortId", "arrivalPortId");

-- CreateIndex
CREATE INDEX "cargo_allocations_organizationId_idx" ON "cargo_allocations"("organizationId");

-- CreateIndex
CREATE INDEX "cargo_allocations_cargoPoolId_idx" ON "cargo_allocations"("cargoPoolId");

-- CreateIndex
CREATE INDEX "cargo_allocations_storeId_idx" ON "cargo_allocations"("storeId");

-- CreateIndex
CREATE INDEX "cargo_allocations_productId_idx" ON "cargo_allocations"("productId");

-- CreateIndex
CREATE INDEX "cargo_allocations_status_idx" ON "cargo_allocations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_referenceCode_key" ON "shipments"("referenceCode");

-- CreateIndex
CREATE INDEX "shipments_cargoPoolId_idx" ON "shipments"("cargoPoolId");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_originPortId_destinationPortId_idx" ON "shipments"("originPortId", "destinationPortId");

-- CreateIndex
CREATE INDEX "shipment_events_shipmentId_occurredAt_idx" ON "shipment_events"("shipmentId", "occurredAt");

-- CreateIndex
CREATE INDEX "shipment_events_eventType_idx" ON "shipment_events"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "landed_cost_breakdowns_cargoAllocationId_key" ON "landed_cost_breakdowns"("cargoAllocationId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_intents_providerReference_key" ON "payment_intents"("providerReference");

-- CreateIndex
CREATE INDEX "payment_intents_organizationId_idx" ON "payment_intents"("organizationId");

-- CreateIndex
CREATE INDEX "payment_intents_cargoAllocationId_idx" ON "payment_intents"("cargoAllocationId");

-- CreateIndex
CREATE INDEX "payment_intents_status_idx" ON "payment_intents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_records_paymentIntentId_key" ON "escrow_records"("paymentIntentId");

-- CreateIndex
CREATE INDEX "escrow_records_status_idx" ON "escrow_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "manifest_documents_storageKey_key" ON "manifest_documents"("storageKey");

-- CreateIndex
CREATE INDEX "manifest_documents_shipmentId_idx" ON "manifest_documents"("shipmentId");

-- CreateIndex
CREATE INDEX "manifest_documents_cargoAllocationId_idx" ON "manifest_documents"("cargoAllocationId");

-- CreateIndex
CREATE INDEX "manifest_documents_documentType_idx" ON "manifest_documents"("documentType");

-- CreateIndex
CREATE INDEX "conversations_organizationId_idx" ON "conversations"("organizationId");

-- CreateIndex
CREATE INDEX "conversations_counterpartyOrganizationId_idx" ON "conversations"("counterpartyOrganizationId");

-- CreateIndex
CREATE INDEX "conversations_storeId_idx" ON "conversations"("storeId");

-- CreateIndex
CREATE INDEX "conversations_tradePartnerId_idx" ON "conversations"("tradePartnerId");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "messages_conversationId_sentAt_idx" ON "messages"("conversationId", "sentAt");

-- CreateIndex
CREATE INDEX "messages_senderUserId_idx" ON "messages"("senderUserId");

-- CreateIndex
CREATE INDEX "messages_senderTradePartnerId_idx" ON "messages"("senderTradePartnerId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_organizationId_key" ON "notification_preferences"("organizationId");

-- CreateIndex
CREATE INDEX "webhook_endpoints_organizationId_idx" ON "webhook_endpoints"("organizationId");

-- CreateIndex
CREATE INDEX "webhook_endpoints_isActive_idx" ON "webhook_endpoints"("isActive");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookEndpointId_idx" ON "webhook_deliveries"("webhookEndpointId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_eventType_idx" ON "webhook_deliveries"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_partners" ADD CONSTRAINT "trade_partners_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_partners" ADD CONSTRAINT "trade_partners_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_relationships" ADD CONSTRAINT "trade_relationships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_relationships" ADD CONSTRAINT "trade_relationships_counterpartyOrganizationId_fkey" FOREIGN KEY ("counterpartyOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_relationships" ADD CONSTRAINT "trade_relationships_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessels" ADD CONSTRAINT "vessels_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_routes" ADD CONSTRAINT "shipment_routes_originPortId_fkey" FOREIGN KEY ("originPortId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_routes" ADD CONSTRAINT "shipment_routes_destinationPortId_fkey" FOREIGN KEY ("destinationPortId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_pools" ADD CONSTRAINT "cargo_pools_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "shipment_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_pools" ADD CONSTRAINT "cargo_pools_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_pools" ADD CONSTRAINT "cargo_pools_departurePortId_fkey" FOREIGN KEY ("departurePortId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_pools" ADD CONSTRAINT "cargo_pools_arrivalPortId_fkey" FOREIGN KEY ("arrivalPortId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_allocations" ADD CONSTRAINT "cargo_allocations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_allocations" ADD CONSTRAINT "cargo_allocations_cargoPoolId_fkey" FOREIGN KEY ("cargoPoolId") REFERENCES "cargo_pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_allocations" ADD CONSTRAINT "cargo_allocations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_allocations" ADD CONSTRAINT "cargo_allocations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_allocations" ADD CONSTRAINT "cargo_allocations_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_cargoPoolId_fkey" FOREIGN KEY ("cargoPoolId") REFERENCES "cargo_pools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_originPortId_fkey" FOREIGN KEY ("originPortId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_destinationPortId_fkey" FOREIGN KEY ("destinationPortId") REFERENCES "ports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_portId_fkey" FOREIGN KEY ("portId") REFERENCES "ports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landed_cost_breakdowns" ADD CONSTRAINT "landed_cost_breakdowns_cargoAllocationId_fkey" FOREIGN KEY ("cargoAllocationId") REFERENCES "cargo_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_cargoAllocationId_fkey" FOREIGN KEY ("cargoAllocationId") REFERENCES "cargo_allocations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_records" ADD CONSTRAINT "escrow_records_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "payment_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_documents" ADD CONSTRAINT "manifest_documents_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifest_documents" ADD CONSTRAINT "manifest_documents_cargoAllocationId_fkey" FOREIGN KEY ("cargoAllocationId") REFERENCES "cargo_allocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_counterpartyOrganizationId_fkey" FOREIGN KEY ("counterpartyOrganizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tradePartnerId_fkey" FOREIGN KEY ("tradePartnerId") REFERENCES "trade_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderTradePartnerId_fkey" FOREIGN KEY ("senderTradePartnerId") REFERENCES "trade_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
