/*
  Warnings:

  - You are about to drop the column `productId` on the `cargo_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `cargo_allocations` table. All the data in the column will be lost.
  - You are about to drop the column `quantityUnit` on the `cargo_allocations` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `notification_preferences` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "cargo_allocations" DROP CONSTRAINT "cargo_allocations_productId_fkey";

-- DropIndex
DROP INDEX "cargo_allocations_productId_idx";

-- AlterTable
ALTER TABLE "cargo_allocations" DROP COLUMN "productId",
DROP COLUMN "quantity",
DROP COLUMN "quantityUnit",
ALTER COLUMN "cargoPoolId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "notification_preferences" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "trade_partners" ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "cargo_allocation_items" (
    "id" TEXT NOT NULL,
    "cargoAllocationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "quantityUnit" "PricingUnit" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_allocation_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cargo_allocation_items_cargoAllocationId_idx" ON "cargo_allocation_items"("cargoAllocationId");

-- CreateIndex
CREATE INDEX "cargo_allocation_items_productId_idx" ON "cargo_allocation_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "cargo_allocation_items_cargoAllocationId_productId_key" ON "cargo_allocation_items"("cargoAllocationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "cargo_allocation_items" ADD CONSTRAINT "cargo_allocation_items_cargoAllocationId_fkey" FOREIGN KEY ("cargoAllocationId") REFERENCES "cargo_allocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cargo_allocation_items" ADD CONSTRAINT "cargo_allocation_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
