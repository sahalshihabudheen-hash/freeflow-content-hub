
-- User-uploaded comics
CREATE TABLE public.user_comics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comic_id UUID NOT NULL REFERENCES public.user_comics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  number TEXT NOT NULL,
  title TEXT,
  page_paths TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_comics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_chapters ENABLE ROW LEVEL SECURITY;

-- Anyone can view; only owner can write
CREATE POLICY "Comics viewable by all" ON public.user_comics FOR SELECT USING (true);
CREATE POLICY "Owner can insert comic" ON public.user_comics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update comic" ON public.user_comics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete comic" ON public.user_comics FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Chapters viewable by all" ON public.user_chapters FOR SELECT USING (true);
CREATE POLICY "Owner can insert chapter" ON public.user_chapters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can update chapter" ON public.user_chapters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can delete chapter" ON public.user_chapters FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for user comics
INSERT INTO storage.buckets (id, name, public) VALUES ('comics', 'comics', true);

CREATE POLICY "Public can view comic files" ON storage.objects FOR SELECT USING (bucket_id = 'comics');
CREATE POLICY "Authed can upload comic files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'comics' AND auth.uid() IS NOT NULL AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners can update comic files" ON storage.objects FOR UPDATE USING (bucket_id = 'comics' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners can delete comic files" ON storage.objects FOR DELETE USING (bucket_id = 'comics' AND auth.uid()::text = (storage.foldername(name))[1]);
