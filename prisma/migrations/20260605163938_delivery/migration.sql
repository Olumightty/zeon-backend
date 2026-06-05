-- AlterTable
ALTER TABLE "cargo_allocations" ADD COLUMN     "deliveryAddress" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "status" SET DEFAULT 'DRAFT';
