/*
  Warnings:

  - The values [TRADE_PARTNER] on the enum `MessageSenderType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `counterpartyOrganizationId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `tradePartnerId` on the `conversations` table. All the data in the column will be lost.
  - You are about to drop the column `senderTradePartnerId` on the `messages` table. All the data in the column will be lost.
  - Added the required column `type` to the `ports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PortType" AS ENUM ('SEA', 'AIR', 'LAND');

-- CreateEnum
CREATE TYPE "ConversationParticipantRole" AS ENUM ('REQUESTER', 'RESPONDER', 'ASSIGNEE');

-- AlterEnum
BEGIN;
CREATE TYPE "MessageSenderType_new" AS ENUM ('USER', 'SYSTEM');
ALTER TABLE "messages" ALTER COLUMN "senderType" TYPE "MessageSenderType_new" USING ("senderType"::text::"MessageSenderType_new");
ALTER TYPE "MessageSenderType" RENAME TO "MessageSenderType_old";
ALTER TYPE "MessageSenderType_new" RENAME TO "MessageSenderType";
DROP TYPE "public"."MessageSenderType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_counterpartyOrganizationId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_storeId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_tradePartnerId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderTradePartnerId_fkey";

-- DropIndex
DROP INDEX "conversations_counterpartyOrganizationId_idx";

-- DropIndex
DROP INDEX "conversations_organizationId_idx";

-- DropIndex
DROP INDEX "conversations_tradePartnerId_idx";

-- DropIndex
DROP INDEX "messages_senderTradePartnerId_idx";

-- AlterTable
ALTER TABLE "conversations" DROP COLUMN "counterpartyOrganizationId",
DROP COLUMN "organizationId",
DROP COLUMN "tradePartnerId",
ALTER COLUMN "storeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "senderTradePartnerId";

-- AlterTable
ALTER TABLE "ports" ADD COLUMN     "type" "PortType" NOT NULL;

-- CreateTable
CREATE TABLE "conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "role" "ConversationParticipantRole" NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_idx" ON "conversation_participants"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE INDEX "conversation_participants_organizationId_idx" ON "conversation_participants"("organizationId");

-- CreateIndex
CREATE INDEX "conversation_participants_role_idx" ON "conversation_participants"("role");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participants_conversationId_organizationId_key" ON "conversation_participants"("conversationId", "organizationId");

-- CreateIndex
CREATE INDEX "conversations_productId_idx" ON "conversations"("productId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
