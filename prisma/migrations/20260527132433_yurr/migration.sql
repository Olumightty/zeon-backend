-- AlterTable
ALTER TABLE "cargo_allocations" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payment_intents" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "payment_intents" ADD CONSTRAINT "payment_intents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
