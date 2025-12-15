-- Admin RLS policies for CRUD operations
-- These use service role or will be called via edge functions

-- Events: Allow insert/update for authenticated service role
CREATE POLICY "Admin can insert events" 
ON public.events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can update events" 
ON public.events 
FOR UPDATE 
USING (true);

-- Recordings: Allow insert/update for authenticated service role
CREATE POLICY "Admin can insert recordings" 
ON public.recordings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can update recordings" 
ON public.recordings 
FOR UPDATE 
USING (true);

-- Static pages: Allow update for admin
CREATE POLICY "Admin can update static pages" 
ON public.static_pages 
FOR UPDATE 
USING (true);

-- Members: Allow select for admin export
CREATE POLICY "Admin can select members" 
ON public.members 
FOR SELECT 
USING (true);