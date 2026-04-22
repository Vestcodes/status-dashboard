-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: monitors (Projects we are tracking)
CREATE TABLE IF NOT EXISTS monitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: latency_logs (Edge regional latency pings)
CREATE TABLE IF NOT EXISTS latency_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  region TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  is_up BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: incidents (Manual or automated incident reports)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID REFERENCES monitors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'investigating', -- investigating, identified, resolved
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_latency_logs_monitor_id ON latency_logs(monitor_id);
CREATE INDEX IF NOT EXISTS idx_latency_logs_created_at ON latency_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_monitor_id ON incidents(monitor_id);

-- ROW LEVEL SECURITY (SOC 2 Type 2 isolation)
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE latency_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access to active monitors" ON monitors FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to latency logs" ON latency_logs FOR SELECT USING (true);
CREATE POLICY "Public read access to incidents" ON incidents FOR SELECT USING (true);

-- Admin write policies (Requires authenticated Supabase user)
CREATE POLICY "Admin full access monitors" ON monitors FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access latency_logs" ON latency_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access incidents" ON incidents FOR ALL USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monitors_updated_at BEFORE UPDATE ON monitors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
