-- 1. Clean up old tables
DROP TABLE IF EXISTS incidents_old;
DROP TABLE IF EXISTS latency_logs;

-- 2. Update Monitors to link to Projects and Services
-- We will recreate monitors to be safe if it has no important data, or alter it.
-- Let's alter it.
ALTER TABLE monitors 
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'GET',
  ADD COLUMN IF NOT EXISTS expected_status INTEGER DEFAULT 200,
  ADD COLUMN IF NOT EXISTS interval_seconds INTEGER DEFAULT 60;

-- 3. Create Subscribers Table for Mailing
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, email)
);

-- 4. Update Incidents to support updates
ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical'));

CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
    body TEXT NOT NULL,
    notified_subscribers BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sysadmin Only - Ensure no RLS public insert on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow read access to public for projects, services, incidents (for the status pages)
CREATE POLICY "Public can view projects" ON projects FOR SELECT USING (is_public = true);
CREATE POLICY "Public can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Public can view incidents" ON incidents FOR SELECT USING (true);
CREATE POLICY "Public can view incident updates" ON incident_updates FOR SELECT USING (true);

-- Subscribers can insert themselves (subscribe), but can only view themselves if they have a token, or we handle it via API bypass (Service Role).
-- For now, API routes will handle subscriptions using the Service Role Key, so no public RLS insert is needed.
