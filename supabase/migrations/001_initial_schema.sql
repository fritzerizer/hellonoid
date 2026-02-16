-- Hellonoid Database Schema

CREATE TABLE manufacturers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100),
  website VARCHAR(500),
  logo_url TEXT,
  founded_year INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE robots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  manufacturer_id INTEGER REFERENCES manufacturers(id),
  status VARCHAR(50) CHECK (status IN ('announced', 'development', 'shipping', 'discontinued')) DEFAULT 'announced',
  category VARCHAR(100),
  hero_image_url TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE robot_specs (
  id SERIAL PRIMARY KEY,
  robot_id INTEGER REFERENCES robots(id) ON DELETE CASCADE,
  spec_key VARCHAR(255) NOT NULL,
  spec_value TEXT NOT NULL,
  spec_unit VARCHAR(50) DEFAULT '',
  spec_category VARCHAR(50) CHECK (spec_category IN ('dimensions', 'performance', 'sensors', 'battery', 'actuators', 'general')) DEFAULT 'general'
);

CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  content TEXT,
  robot_id INTEGER REFERENCES robots(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  source_url TEXT,
  image_url TEXT
);

CREATE INDEX idx_robots_slug ON robots(slug);
CREATE INDEX idx_robots_manufacturer ON robots(manufacturer_id);
CREATE INDEX idx_robots_status ON robots(status);
CREATE INDEX idx_robot_specs_robot ON robot_specs(robot_id);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_news_robot ON news(robot_id);
