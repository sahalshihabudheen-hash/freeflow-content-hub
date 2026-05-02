CREATE TABLE public.search_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('search','click')),
  query TEXT NOT NULL,
  manga_id TEXT,
  manga_title TEXT,
  position INTEGER,
  results_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_events_query ON public.search_events (query);
CREATE INDEX idx_search_events_created_at ON public.search_events (created_at DESC);
CREATE INDEX idx_search_events_type ON public.search_events (event_type);

ALTER TABLE public.search_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search events"
ON public.search_events
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view search events"
ON public.search_events
FOR SELECT
TO authenticated
USING (is_admin());
