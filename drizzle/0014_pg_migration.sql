-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "walletId" INTEGER NOT NULL,
  "bundleId" INTEGER,
  "amount" NUMERIC(12,2) NOT NULL,
  "creditsAdded" NUMERIC(12,2) NOT NULL,
  "type" VARCHAR(20) NOT NULL,
  "stripeSessionId" VARCHAR(128),
  "stripePaymentIntentId" VARCHAR(128),
  "description" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add escalation_rules table
CREATE TABLE IF NOT EXISTS "escalation_rules" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(256) NOT NULL,
  "description" TEXT,
  "priority" VARCHAR(32) DEFAULT 'normal',
  "category" VARCHAR(64),
  "escalateAfterMinutes" INTEGER NOT NULL DEFAULT 60,
  "triggerType" VARCHAR(64) NOT NULL DEFAULT 'no_response',
  "escalationLevel" INTEGER NOT NULL DEFAULT 1,
  "escalateToRole" VARCHAR(32) DEFAULT 'host',
  "escalateToUserId" INTEGER,
  "notifyEmail" BOOLEAN DEFAULT TRUE,
  "notifyInApp" BOOLEAN DEFAULT TRUE,
  "autoReassign" BOOLEAN DEFAULT FALSE,
  "autoPriorityBump" BOOLEAN DEFAULT FALSE,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add escalation_log table
CREATE TABLE IF NOT EXISTS "escalation_log" (
  "id" SERIAL PRIMARY KEY,
  "ticketId" INTEGER NOT NULL,
  "ruleId" INTEGER,
  "escalationLevel" INTEGER NOT NULL DEFAULT 1,
  "previousAssignee" INTEGER,
  "newAssignee" INTEGER,
  "previousPriority" VARCHAR(32),
  "newPriority" VARCHAR(32),
  "reason" TEXT,
  "slaBreach" BOOLEAN DEFAULT FALSE,
  "status" VARCHAR(32) DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL
);
