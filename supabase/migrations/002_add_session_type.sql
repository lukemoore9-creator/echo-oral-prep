-- Add session_type column to distinguish exams from drills
ALTER TABLE sessions ADD COLUMN session_type text NOT NULL DEFAULT 'exam';
