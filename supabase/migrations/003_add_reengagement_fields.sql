-- Add re-engagement tracking fields to athletes table
ALTER TABLE athletes ADD COLUMN last_reengagement_sent timestamp with time zone;
ALTER TABLE athletes ADD COLUMN reengagement_count integer DEFAULT 0;
