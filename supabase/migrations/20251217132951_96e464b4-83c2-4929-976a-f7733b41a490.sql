-- Add new event format types: clinic and reverse-pitch
ALTER TYPE event_format ADD VALUE IF NOT EXISTS 'clinic';
ALTER TYPE event_format ADD VALUE IF NOT EXISTS 'reverse-pitch';

-- Add artifact_url column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS artifact_url text;