-- Menukaart Module (PostgreSQL)

-- Menu Seasons
CREATE TABLE IF NOT EXISTS menu_seasons (
  id serial PRIMARY KEY,
  name varchar(128) NOT NULL,
  slug varchar(64) NOT NULL,
  "startDate" bigint,
  "endDate" bigint,
  "isActive" boolean DEFAULT false,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id serial PRIMARY KEY,
  name varchar(128) NOT NULL,
  slug varchar(64) NOT NULL,
  description text,
  icon varchar(32),
  "sortOrder" integer DEFAULT 0,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id serial PRIMARY KEY,
  "categoryId" integer NOT NULL,
  name varchar(256) NOT NULL,
  description text,
  "priceEur" decimal(10,2) NOT NULL,
  "memberPriceEur" decimal(10,2),
  allergens text,
  tags text,
  "imageUrl" text,
  "isVegan" boolean DEFAULT false,
  "isVegetarian" boolean DEFAULT false,
  "isGlutenFree" boolean DEFAULT false,
  "isPopular" boolean DEFAULT false,
  "isNew" boolean DEFAULT false,
  "sortOrder" integer DEFAULT 0,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Menu Season Items (link items to seasons with optional price override)
CREATE TABLE IF NOT EXISTS menu_season_items (
  id serial PRIMARY KEY,
  "seasonId" integer NOT NULL,
  "itemId" integer NOT NULL,
  "overridePriceEur" decimal(10,2),
  "overrideMemberPriceEur" decimal(10,2),
  "isHighlighted" boolean DEFAULT false,
  "sortOrder" integer DEFAULT 0
);

-- Menu Preparations (kitchen prep tracking)
CREATE TABLE IF NOT EXISTS menu_preparations (
  id serial PRIMARY KEY,
  "itemId" integer NOT NULL,
  "locationId" integer,
  "prepDate" bigint NOT NULL,
  "quantityPrepared" integer NOT NULL DEFAULT 0,
  "quantitySold" integer NOT NULL DEFAULT 0,
  "quantityWasted" integer NOT NULL DEFAULT 0,
  notes text,
  "preparedBy" integer,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Menu Arrangements (bundled deals)
CREATE TABLE IF NOT EXISTS menu_arrangements (
  id serial PRIMARY KEY,
  name varchar(256) NOT NULL,
  description text,
  "priceEur" decimal(10,2) NOT NULL,
  "memberPriceEur" decimal(10,2),
  items text,
  "isActive" boolean DEFAULT true,
  "sortOrder" integer DEFAULT 0,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items ("categoryId");
CREATE INDEX IF NOT EXISTS idx_menu_season_items_season ON menu_season_items ("seasonId");
CREATE INDEX IF NOT EXISTS idx_menu_season_items_item ON menu_season_items ("itemId");
CREATE INDEX IF NOT EXISTS idx_menu_preparations_item ON menu_preparations ("itemId");
CREATE INDEX IF NOT EXISTS idx_menu_preparations_date ON menu_preparations ("prepDate");
