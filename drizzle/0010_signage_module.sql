-- Signage Module Migration (PostgreSQL)
-- Creates all signage, wayfinding, kitchen menu, and gym schedule tables

-- Enums
DO $$ BEGIN
  CREATE TYPE signage_screen_type AS ENUM ('reception', 'gym', 'kitchen', 'wayfinding', 'general', 'meeting_room', 'elevator', 'parking');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signage_screen_status AS ENUM ('online', 'offline', 'provisioning', 'maintenance', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signage_orientation AS ENUM ('portrait', 'landscape');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signage_content_type AS ENUM ('image', 'video', 'html', 'url', 'menu_card', 'wayfinding', 'gym_schedule', 'weather', 'clock', 'news_ticker', 'company_presence', 'welcome_screen', 'announcement');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signage_schedule_type AS ENUM ('always', 'time_based', 'day_based');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE signage_audit_action AS ENUM ('provisioned', 'content_changed', 'playlist_assigned', 'screen_online', 'screen_offline', 'settings_changed', 'error_reported', 'reboot', 'firmware_update');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kitchen_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'drink', 'soup', 'salad', 'sandwich', 'special');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gym_category AS ENUM ('cardio', 'strength', 'yoga', 'pilates', 'hiit', 'cycling', 'boxing', 'stretching', 'meditation', 'egym');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE presence_method AS ENUM ('manual', 'access_log', 'auto', 'api');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Signage Screens
CREATE TABLE IF NOT EXISTS signage_screens (
  id SERIAL PRIMARY KEY,
  "locationId" INTEGER NOT NULL,
  name TEXT NOT NULL,
  "screenType" signage_screen_type NOT NULL,
  orientation signage_orientation DEFAULT 'portrait',
  resolution TEXT DEFAULT '1080x1920',
  floor TEXT,
  zone TEXT,
  "provisioningToken" TEXT UNIQUE,
  status signage_screen_status DEFAULT 'provisioning',
  "lastHeartbeat" TIMESTAMP,
  "currentPlaylistId" INTEGER,
  "ipAddress" TEXT,
  "macAddress" TEXT,
  "userAgent" TEXT,
  "firmwareVersion" TEXT,
  brightness INTEGER DEFAULT 100,
  volume INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  tags JSONB,
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Signage Screen Groups
CREATE TABLE IF NOT EXISTS signage_screen_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "locationId" INTEGER,
  "screenType" signage_screen_type,
  color TEXT DEFAULT '#627653',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Screen-Group Membership
CREATE TABLE IF NOT EXISTS signage_screen_group_members (
  id SERIAL PRIMARY KEY,
  "screenId" INTEGER NOT NULL,
  "groupId" INTEGER NOT NULL
);

-- Signage Content
CREATE TABLE IF NOT EXISTS signage_content (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  "contentType" signage_content_type NOT NULL,
  "mediaUrl" TEXT,
  "htmlContent" TEXT,
  "externalUrl" TEXT,
  duration INTEGER DEFAULT 15,
  "templateData" JSONB,
  "targetScreenTypes" JSONB,
  "locationId" INTEGER,
  "isActive" BOOLEAN DEFAULT true,
  "validFrom" TIMESTAMP,
  "validUntil" TIMESTAMP,
  priority INTEGER DEFAULT 0,
  "createdByUserId" INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Signage Playlists
CREATE TABLE IF NOT EXISTS signage_playlists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "screenType" signage_screen_type,
  "locationId" INTEGER,
  "isDefault" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "scheduleType" signage_schedule_type DEFAULT 'always',
  "scheduleConfig" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Signage Playlist Items
CREATE TABLE IF NOT EXISTS signage_playlist_items (
  id SERIAL PRIMARY KEY,
  "playlistId" INTEGER NOT NULL,
  "contentId" INTEGER NOT NULL,
  "sortOrder" INTEGER DEFAULT 0,
  "durationOverride" INTEGER,
  "isActive" BOOLEAN DEFAULT true
);

-- Signage Provisioning Templates
CREATE TABLE IF NOT EXISTS signage_provisioning_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  "screenType" signage_screen_type NOT NULL,
  "defaultPlaylistId" INTEGER,
  "defaultOrientation" signage_orientation DEFAULT 'portrait',
  "defaultResolution" TEXT DEFAULT '1080x1920',
  "defaultBrightness" INTEGER DEFAULT 100,
  "autoAssignLocation" BOOLEAN DEFAULT true,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Wayfinding Buildings
CREATE TABLE IF NOT EXISTS wayfinding_buildings (
  id SERIAL PRIMARY KEY,
  "locationId" INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  floors INTEGER DEFAULT 1,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Wayfinding Company Assignments
CREATE TABLE IF NOT EXISTS wayfinding_company_assignments (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "buildingId" INTEGER NOT NULL,
  floor TEXT,
  "roomNumber" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Wayfinding Company Presence
CREATE TABLE IF NOT EXISTS wayfinding_company_presence (
  id SERIAL PRIMARY KEY,
  "companyId" INTEGER NOT NULL,
  "locationId" INTEGER NOT NULL,
  "buildingId" INTEGER,
  "isPresent" BOOLEAN DEFAULT false,
  "checkedInAt" TIMESTAMP,
  "checkedOutAt" TIMESTAMP,
  "checkedInByUserId" INTEGER,
  method presence_method DEFAULT 'manual',
  date TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Signage Heartbeats
CREATE TABLE IF NOT EXISTS signage_heartbeats (
  id SERIAL PRIMARY KEY,
  "screenId" INTEGER NOT NULL,
  status signage_screen_status DEFAULT 'online',
  "currentContentId" INTEGER,
  "currentPlaylistId" INTEGER,
  "cpuUsage" TEXT,
  "memoryUsage" TEXT,
  temperature TEXT,
  uptime INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Signage Audit Log
CREATE TABLE IF NOT EXISTS signage_audit_log (
  id SERIAL PRIMARY KEY,
  "screenId" INTEGER,
  action signage_audit_action NOT NULL,
  description TEXT,
  "userId" INTEGER,
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Kitchen Menu Items
CREATE TABLE IF NOT EXISTS kitchen_menu_items (
  id SERIAL PRIMARY KEY,
  "locationId" INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category kitchen_category NOT NULL,
  price TEXT,
  "imageUrl" TEXT,
  allergens JSONB,
  "isVegan" BOOLEAN DEFAULT false,
  "isVegetarian" BOOLEAN DEFAULT false,
  "isGlutenFree" BOOLEAN DEFAULT false,
  "isAvailable" BOOLEAN DEFAULT true,
  "dayOfWeek" JSONB,
  "sortOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Gym Schedules
CREATE TABLE IF NOT EXISTS gym_schedules (
  id SERIAL PRIMARY KEY,
  "locationId" INTEGER NOT NULL,
  "className" TEXT NOT NULL,
  instructor TEXT,
  description TEXT,
  category gym_category NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "maxParticipants" INTEGER DEFAULT 20,
  "currentParticipants" INTEGER DEFAULT 0,
  "imageUrl" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
