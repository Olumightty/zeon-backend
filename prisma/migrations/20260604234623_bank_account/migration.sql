-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('SAVINGS', 'CURRENT', 'CHECKING');

-- CreateEnum
CREATE TYPE "AccountHolderType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" "BankAccountType" NOT NULL DEFAULT 'CURRENT',
    "holderType" "AccountHolderType" NOT NULL DEFAULT 'BUSINESS',
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "swiftBic" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "routingMetadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_storeId_key" ON "bank_accounts"("storeId");

-- CreateIndex
CREATE INDEX "bank_accounts_storeId_idx" ON "bank_accounts"("storeId");

-- CreateIndex
CREATE INDEX "bank_accounts_countryCode_currencyCode_idx" ON "bank_accounts"("countryCode", "currencyCode");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
