-- Phase 26: Parking Pools Upgrade (PostgreSQL)

-- Create enum types first
DO $$ BEGIN
  CREATE TYPE parking_sla_tier AS ENUM ('platinum','gold','silver','bronze');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_entry_method AS ENUM ('anpr','qr','manual','app');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_access_type AS ENUM ('member','visitor','external','pay_per_use','pool_guaranteed','pool_overflow');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_access_direction AS ENUM ('entry','exit');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_pool_member_role AS ENUM ('admin','member');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_pool_member_status AS ENUM ('active','suspended','removed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_visitor_permit_status AS ENUM ('active','used','expired','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_visitor_share_method AS ENUM ('whatsapp','email','sms','link');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_sla_violation_type AS ENUM ('denied_entry','no_spot_available','downgrade');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE parking_compensation_status AS ENUM ('pending','credited','waived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Extend parking_zones
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "reservedSpots" integer DEFAULT 0;
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "overbookingEnabled" boolean DEFAULT false;
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "overbookingRatio" decimal(4,2) DEFAULT 1.20;
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "noShowRateAvg" decimal(4,2) DEFAULT 0.25;
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "costUnderbooking" decimal(8,2) DEFAULT 75.00;
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "costOverbooking" decimal(8,2) DEFAULT 50.00;
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "payPerUseEnabled" boolean DEFAULT false;
ALTER TABLE parking_zones ADD COLUMN IF NOT EXISTS "payPerUseThreshold" integer DEFAULT 85;

-- Extend parking_permits
ALTER TABLE parking_permits ADD COLUMN IF NOT EXISTS "poolId" integer;
ALTER TABLE parking_permits ADD COLUMN IF NOT EXISTS "slaTier" text DEFAULT 'silver';
ALTER TABLE parking_permits ADD COLUMN IF NOT EXISTS "noShowCount" integer DEFAULT 0;
ALTER TABLE parking_permits ADD COLUMN IF NOT EXISTS "penaltyPoints" integer DEFAULT 0;

-- Extend parking_sessions
ALTER TABLE parking_sessions ADD COLUMN IF NOT EXISTS "poolId" integer;
ALTER TABLE parking_sessions ADD COLUMN IF NOT EXISTS "entryMethod" text DEFAULT 'anpr';
ALTER TABLE parking_sessions ADD COLUMN IF NOT EXISTS "accessType" text DEFAULT 'member';

-- New: Parking Pools
CREATE TABLE IF NOT EXISTS parking_pools (
  id serial PRIMARY KEY,
  "zoneId" integer NOT NULL,
  "companyId" integer,
  name varchar(128) NOT NULL,
  "guaranteedSpots" integer NOT NULL DEFAULT 30,
  "maxMembers" integer DEFAULT 0,
  "overflowPriceEur" decimal(8,2) DEFAULT 2.50,
  "overflowPriceDay" decimal(8,2) DEFAULT 15.00,
  "monthlyFeeEur" decimal(10,2) DEFAULT 0,
  "slaTier" text DEFAULT 'gold',
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- New: Parking Pool Members
CREATE TABLE IF NOT EXISTS parking_pool_members (
  id serial PRIMARY KEY,
  "poolId" integer NOT NULL,
  "userId" integer NOT NULL,
  "licensePlate" varchar(20),
  "licensePlate2" varchar(20),
  role text DEFAULT 'member',
  status text DEFAULT 'active',
  "joinedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "totalSessions" integer DEFAULT 0,
  "totalOverflowSessions" integer DEFAULT 0,
  "noShowCount" integer DEFAULT 0
);

-- New: Parking Access Log
CREATE TABLE IF NOT EXISTS parking_access_log (
  id serial PRIMARY KEY,
  "zoneId" integer NOT NULL,
  direction text NOT NULL,
  method text NOT NULL,
  "licensePlate" varchar(20),
  "qrToken" varchar(128),
  "userId" integer,
  "permitId" integer,
  "poolId" integer,
  granted boolean NOT NULL DEFAULT false,
  "denialReason" varchar(256),
  "sessionId" integer,
  "responseTimeMs" integer,
  "timestamp" bigint NOT NULL
);

-- New: Parking Visitor Permits
CREATE TABLE IF NOT EXISTS parking_visitor_permits (
  id serial PRIMARY KEY,
  "zoneId" integer NOT NULL,
  "invitedByUserId" integer NOT NULL,
  "visitorName" varchar(256) NOT NULL,
  "visitorEmail" varchar(320),
  "visitorPhone" varchar(20),
  "licensePlate" varchar(20),
  "qrToken" varchar(128) NOT NULL,
  "validFrom" bigint NOT NULL,
  "validUntil" bigint NOT NULL,
  "maxEntries" integer DEFAULT 1,
  "usedEntries" integer DEFAULT 0,
  status text DEFAULT 'active',
  "shareMethod" text,
  notes text,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- New: Parking SLA Violations
CREATE TABLE IF NOT EXISTS parking_sla_violations (
  id serial PRIMARY KEY,
  "zoneId" integer NOT NULL,
  "userId" integer NOT NULL,
  "permitId" integer,
  "poolId" integer,
  "slaTier" text NOT NULL,
  "violationType" text NOT NULL,
  "compensationEur" decimal(8,2) DEFAULT 0,
  "compensationCredits" decimal(8,2) DEFAULT 0,
  "compensationStatus" text DEFAULT 'pending',
  "alternativeOffered" varchar(256),
  "timestamp" bigint NOT NULL,
  "resolvedAt" bigint,
  notes text
);

-- New: Parking Capacity Snapshots
CREATE TABLE IF NOT EXISTS parking_capacity_snapshots (
  id serial PRIMARY KEY,
  "zoneId" integer NOT NULL,
  "timestamp" bigint NOT NULL,
  "totalSpots" integer NOT NULL,
  occupied integer NOT NULL,
  reserved integer DEFAULT 0,
  "poolGuaranteed" integer DEFAULT 0,
  "poolOverflow" integer DEFAULT 0,
  "payPerUse" integer DEFAULT 0,
  visitors integer DEFAULT 0,
  "occupancyPercent" decimal(5,2) NOT NULL,
  "predictedPeak" decimal(5,2),
  "overbookingHeadroom" integer DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON parking_pool_members ("poolId");
CREATE INDEX IF NOT EXISTS idx_pool_members_user ON parking_pool_members ("userId");
CREATE INDEX IF NOT EXISTS idx_access_log_zone_ts ON parking_access_log ("zoneId", "timestamp");
CREATE INDEX IF NOT EXISTS idx_access_log_plate ON parking_access_log ("licensePlate");
CREATE INDEX IF NOT EXISTS idx_visitor_permits_qr ON parking_visitor_permits ("qrToken");
CREATE INDEX IF NOT EXISTS idx_visitor_permits_zone ON parking_visitor_permits ("zoneId", "validFrom", "validUntil");
CREATE INDEX IF NOT EXISTS idx_capacity_zone_ts ON parking_capacity_snapshots ("zoneId", "timestamp");
CREATE INDEX IF NOT EXISTS idx_sessions_pool ON parking_sessions ("poolId");
CREATE INDEX IF NOT EXISTS idx_permits_pool ON parking_permits ("poolId");
