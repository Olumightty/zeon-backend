-- AlterTable
ALTER TABLE "cargo_allocations" ALTER COLUMN "deliveryAddress" DROP NOT NULL,
ALTER COLUMN "deliveryAddress" DROP DEFAULT;
