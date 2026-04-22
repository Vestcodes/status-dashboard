-- PRD Schema Update

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE, -- e.g. product.status.vestcodes.co
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- api, db, cron, external
  region TEXT NOT NULL DEFAULT 'global', -- fra1, iad1, etc
  endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Statuses Table
CREATE TABLE IF NOT EXISTS statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- operational, degraded, down
  response_time INTEGER,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB
);

-- Alter existing incidents table or drop and recreate if easy
-- Actually, let's just create a new incidents table that links to project_id instead of monitor_id
-- We'll rename old to incidents_old just to be safe
ALTER TABLE IF EXISTS incidents RENAME TO incidents_old;

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'investigating', -- investigating, identified, resolved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read projects" ON projects FOR SELECT USING (is_public = true);
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read statuses" ON statuses FOR SELECT USING (true);
CREATE POLICY "Public read incidents" ON incidents FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admin full projects" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full services" ON services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full statuses" ON statuses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full incidents" ON incidents FOR ALL USING (auth.role() = 'authenticated');

