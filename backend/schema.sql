-- 1. Tabela de Conteúdo de Mídia
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    duration_seconds INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Playlists
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Itens da Playlist (Relacionamento m:n com ordem)
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    UNIQUE(playlist_id, sort_order)
);

-- 4. Tabela de TVs
CREATE TABLE IF NOT EXISTS public.tvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'offline',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Realtime para estas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.tvs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_items;
