-- Migration: Rename manufacturers → entities, add entity_type, create newsletter tables
-- Date: 2026-03-05
-- Card: #165

-- ============================================
-- 1. Rename manufacturers → entities
-- ============================================

-- Rename the table
ALTER TABLE manufacturers RENAME TO entities;

-- Add entity_type column (text for flexibility — new types via UI without migration)
ALTER TABLE entities ADD COLUMN entity_type VARCHAR(50) DEFAULT 'manufacturer';

-- Set existing records to 'manufacturer'
UPDATE entities SET entity_type = 'manufacturer' WHERE entity_type IS NULL;

-- Add NOT NULL constraint after setting defaults
ALTER TABLE entities ALTER COLUMN entity_type SET NOT NULL;

-- Update the robots FK constraint name (rename for clarity)
ALTER TABLE robots RENAME COLUMN manufacturer_id TO entity_id;

-- ============================================
-- 2. Newsletter subscriptions table
-- ============================================

CREATE TABLE newsletter_subscriptions (
  id SERIAL PRIMARY KEY,
  entity_id INTEGER REFERENCES entities(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email_address VARCHAR(255) NOT NULL DEFAULT 'updates@hellonoid.com',
  signup_url TEXT,
  frequency VARCHAR(50) DEFAULT 'unknown' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'unknown')),
  total_received INTEGER DEFAULT 0,
  first_received_at TIMESTAMPTZ,
  last_received_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'unsubscribed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Newsletter items table
-- ============================================

CREATE TABLE newsletter_items (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES newsletter_subscriptions(id) ON DELETE CASCADE,
  subject VARCHAR(1000) NOT NULL,
  sender_email VARCHAR(255),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'verifying', 'processed')),
  raw_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Indexes
-- ============================================

CREATE INDEX idx_entities_type ON entities(entity_type);
CREATE INDEX idx_newsletter_subs_entity ON newsletter_subscriptions(entity_id);
CREATE INDEX idx_newsletter_subs_status ON newsletter_subscriptions(status);
CREATE INDEX idx_newsletter_items_sub ON newsletter_items(subscription_id);
CREATE INDEX idx_newsletter_items_status ON newsletter_items(status);
CREATE INDEX idx_newsletter_items_received ON newsletter_items(received_at DESC);

-- ============================================
-- 5. Update existing index references
-- ============================================

-- The old idx_robots_manufacturer index on manufacturer_id needs updating
DROP INDEX IF EXISTS idx_robots_manufacturer;
CREATE INDEX idx_robots_entity ON robots(entity_id);
