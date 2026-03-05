
-- 1. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Allow public upload to 'media-content' bucket
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'media-content');

-- 3. Allow public read of 'media-content' bucket
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'media-content');

-- 4. Enable RLS on public.media
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- 5. Allow anonymous insert into public.media
CREATE POLICY "Anon Insert"
ON public.media FOR INSERT
TO anon
WITH CHECK (true);

-- 6. Allow anonymous select from public.media
CREATE POLICY "Anon Select"
ON public.media FOR SELECT
TO anon
USING (true);

-- 7. Allow anonymous delete from public.media (for cleanup)
CREATE POLICY "Anon Delete"
ON public.media FOR DELETE
TO anon
USING (true);
