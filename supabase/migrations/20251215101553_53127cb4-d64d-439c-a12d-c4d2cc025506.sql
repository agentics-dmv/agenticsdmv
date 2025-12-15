-- Create enum types for events
CREATE TYPE public.event_format AS ENUM ('talk', 'panel', 'workshop');
CREATE TYPE public.audience_level AS ENUM ('general', 'technical', 'research');

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  location_text TEXT NOT NULL,
  location_map_link TEXT,
  format_type public.event_format NOT NULL DEFAULT 'talk',
  audience_level public.audience_level NOT NULL DEFAULT 'general',
  rsvp_link TEXT,
  recording_url TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recordings table
CREATE TABLE public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  youtube_url TEXT NOT NULL,
  summary TEXT,
  speaker_names TEXT[],
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members (newsletter signups)
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent BOOLEAN NOT NULL DEFAULT true
);

-- Static pages (CMS content)
CREATE TABLE public.static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Public read access for events
CREATE POLICY "Events are publicly readable"
ON public.events FOR SELECT
USING (true);

-- Public read access for recordings
CREATE POLICY "Recordings are publicly readable"
ON public.recordings FOR SELECT
USING (true);

-- Members: allow public insert (signup), no public read (privacy)
CREATE POLICY "Anyone can join the mailing list"
ON public.members FOR INSERT
WITH CHECK (true);

-- Public read access for static pages
CREATE POLICY "Static pages are publicly readable"
ON public.static_pages FOR SELECT
USING (true);

-- Create index for common queries
CREATE INDEX idx_events_date ON public.events(date_time DESC);
CREATE INDEX idx_events_archived ON public.events(archived);
CREATE INDEX idx_recordings_published ON public.recordings(published_at DESC);
CREATE INDEX idx_static_pages_slug ON public.static_pages(slug);

-- Trigger to update static_pages.updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_static_pages_updated_at
BEFORE UPDATE ON public.static_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();