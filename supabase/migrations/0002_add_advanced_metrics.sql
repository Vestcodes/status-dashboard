-- Add TTFB, HTTP Method tracking, and advanced metrics to statuses
ALTER TABLE statuses ADD COLUMN IF NOT EXISTS ttfb_ms INTEGER;
ALTER TABLE statuses ADD COLUMN IF NOT EXISTS http_method TEXT DEFAULT 'HEAD';

-- Create an index to speed up percentiles calculation
CREATE INDEX IF NOT EXISTS idx_statuses_response_time ON statuses(response_time);
