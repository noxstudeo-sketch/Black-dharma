-- ============================================================
--  BLACK DHARMA — Banco da Etapa 2 (área do membro)
--  Rode DEPOIS do db/schema.sql, no mesmo SQL Editor do Supabase.
--
--  Duas tabelas onde cada membro guarda as PRÓPRIAS coisas:
--   • acervo            -> materiais salvos (textos, fragmentos)
--   • grimorio_entries  -> diário/grimório pessoal
--
--  Padrão de segurança destas tabelas (diferente de 'memberships'):
--  aqui o próprio membro cria e apaga suas linhas — então o RLS
--  amarra tudo a auth.uid(): você só enxerga e mexe no que é SEU.
--  O truque 'default auth.uid()' preenche o dono automaticamente,
--  para o site nunca precisar (nem poder) dizer "isto é de outro".
-- ============================================================


-- ---------------- ACERVO ----------------
create table if not exists public.acervo (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  item_type  text not null default 'corpus',   -- 'corpus' | 'oraculo' | ...
  item_ref   text,                             -- id do texto, ou marca do fragmento
  title      text not null,
  created_at timestamptz not null default now()
);

alter table public.acervo enable row level security;

create policy "acervo: dono le"       on public.acervo for select using ( auth.uid() = user_id );
create policy "acervo: dono cria"     on public.acervo for insert with check ( auth.uid() = user_id );
create policy "acervo: dono atualiza" on public.acervo for update using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );
create policy "acervo: dono apaga"    on public.acervo for delete using ( auth.uid() = user_id );


-- ---------------- GRIMÓRIO PESSOAL ----------------
create table if not exists public.grimorio_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title      text,
  body       text,
  updated_at timestamptz not null default now()
);

alter table public.grimorio_entries enable row level security;

create policy "grimorio: dono le"       on public.grimorio_entries for select using ( auth.uid() = user_id );
create policy "grimorio: dono cria"     on public.grimorio_entries for insert with check ( auth.uid() = user_id );
create policy "grimorio: dono atualiza" on public.grimorio_entries for update using ( auth.uid() = user_id ) with check ( auth.uid() = user_id );
create policy "grimorio: dono apaga"    on public.grimorio_entries for delete using ( auth.uid() = user_id );


-- Índices para listar rápido por membro.
create index if not exists idx_acervo_user   on public.acervo(user_id, created_at desc);
create index if not exists idx_grimorio_user on public.grimorio_entries(user_id, updated_at desc);
