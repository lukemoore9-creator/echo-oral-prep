-- Rename 'wardroom' session type to 'bridge'
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_session_type_check CHECK (session_type IN ('examination', 'bridge', 'drill'));
UPDATE sessions SET session_type = 'bridge' WHERE session_type = 'wardroom';
