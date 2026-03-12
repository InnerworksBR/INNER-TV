-- 1. Profiles Table (Auth)
create table if not exists public.profiles (
  id uuid references auth.users not null,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,

  primary key (id),
  unique(username),
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by the owner."
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Tabela de Conteúdo de Mídia
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'powerbi')),
    duration_seconds INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Playlists
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Itens da Playlist (Relacionamento m:n com ordem)
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    UNIQUE(playlist_id, sort_order)
);

-- 5. Tabela de TVs
CREATE TABLE IF NOT EXISTS public.tvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'offline',
    radio_url TEXT DEFAULT NULL,
    pairing_code TEXT,
    show_bottom_bar BOOLEAN DEFAULT TRUE,
    bottom_bar_color TEXT DEFAULT '#000000',
    show_quotes BOOLEAN DEFAULT TRUE,
    show_weather BOOLEAN DEFAULT TRUE,
    weather_city TEXT DEFAULT 'São Paulo',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Habilitar Realtime para estas tabelas
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tvs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playlist_items;

-- 7. Set up Storage (Buckets and Policies)
insert into storage.buckets (id, name)
values ('avatars', 'avatars')
ON CONFLICT (id) DO NOTHING;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update an avatar."
  on storage.objects for update
  with check ( bucket_id = 'avatars' );

-- 8. Add media storage bucket if needed (assuming user uploads videos/images)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

create policy "Media objects are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'media' );

create policy "Users can upload media."
  on storage.objects for insert
  with check ( bucket_id = 'media' );

create policy "Users can update media."
  on storage.objects for update
  with check ( bucket_id = 'media' );

create policy "Users can delete media."
  on storage.objects for delete
  using ( bucket_id = 'media' );
