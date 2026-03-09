-- Utöka news-tabellen för pipeline med granskning
ALTER TABLE news ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE news ADD COLUMN IF NOT EXISTS significance int DEFAULT 0;
ALTER TABLE news ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];
ALTER TABLE news ADD COLUMN IF NOT EXISTS source_name text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Sätt existerande nyheter som published
UPDATE news SET status = 'published' WHERE status IS NULL;
