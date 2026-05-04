ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'examination' CHECK (session_type IN ('examination', 'wardroom', 'drill'));
