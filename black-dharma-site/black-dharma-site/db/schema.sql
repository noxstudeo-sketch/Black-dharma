-- ============================================================
--  BLACK DHARMA — Esquema do banco de dados (Supabase / PostgreSQL)
--  A ESPINHA DE SEGURANÇA do site. Rode este arquivo UMA vez no
--  Supabase:  Dashboard -> SQL Editor -> New query -> cole tudo -> Run.
--
--  Conceito central: Row Level Security (RLS).
--  Sem RLS, qualquer pessoa com a chave pública (anon) do site poderia
--  ler o banco inteiro. COM RLS, o proprio banco decide, linha por linha,
--  quem pode ver e mudar o que. A seguranca mora aqui, no banco — nunca
--  apenas escondida no visual do site (isso qualquer um contorna).
-- ============================================================


-- ------------------------------------------------------------
-- 1) PERFIS  (uma linha por membro, ligada ao login do Supabase)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  -- O PAPEL. Só existem dois. 'member' é o padrao de todo mundo.
  role         text not null default 'member' check (role in ('member','admin')),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;


-- ------------------------------------------------------------
-- 2) FUNÇÃO is_admin()  — "quem está logado é admin?"
--    SECURITY DEFINER faz ela rodar com permissao elevada e evita
--    recursao de RLS. Usada pelas politicas abaixo.
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- 3) POLÍTICAS de acesso aos PERFIS
-- ------------------------------------------------------------
-- Cada membro lê o PRÓPRIO perfil...
create policy "perfil: ler o proprio"
  on public.profiles for select
  using ( auth.uid() = id );

-- ...e o admin lê TODOS.
create policy "perfil: admin le todos"
  on public.profiles for select
  using ( public.is_admin() );

-- Cada membro atualiza o PRÓPRIO perfil (nome, etc.).
-- A troca de 'role' é bloqueada pelo gatilho da secao 4 — a politica
-- deixa atualizar, o gatilho impede virar admin sozinho.
create policy "perfil: atualizar o proprio"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- O admin atualiza qualquer perfil (inclusive promover alguem a admin).
create policy "perfil: admin atualiza todos"
  on public.profiles for update
  using ( public.is_admin() )
  with check ( public.is_admin() );


-- ------------------------------------------------------------
-- 4) TRAVA ANTI-ESCALONAMENTO  — ninguém se promove a admin
--    Se a linha nova mudar o 'role' e quem faz a operacao NAO for
--    admin, a operacao é recusada. Essa é a defesa que impede um
--    membro comum de virar administrador editando o proprio perfil.
-- ------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Alteracao de papel nao permitida.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_change on public.profiles;
create trigger trg_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();


-- ------------------------------------------------------------
-- 5) CRIAÇÃO AUTOMÁTICA DO PERFIL ao se cadastrar
--    Quando alguem se registra (auth.users), criamos o perfil dele
--    JÁ com role='member'. O papel nunca vem do formulario do site —
--    é fixado aqui no servidor. (Confia no cliente = falha de seguranca.)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ------------------------------------------------------------
-- 6) MEMBRESIAS  (o "está em dia?" que abre ou fecha a porta)
--    O STATUS é escrito só pelo servidor de pagamento (webhook do
--    Mercado Pago), que usa a chave service_role e ignora o RLS.
--    O site NUNCA escreve status — se pudesse, alguem se daria acesso
--    gratis. O membro apenas LÊ o proprio status.
-- ------------------------------------------------------------
create table if not exists public.memberships (
  user_id            uuid primary key references public.profiles(id) on delete cascade,
  tier               text not null default 'postulante' check (tier in ('postulante','iniciado','custodio')),
  status             text not null default 'inactive'  check (status in ('active','inactive','past_due','canceled')),
  current_period_end timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.memberships enable row level security;

-- Membro lê a PRÓPRIA membresia; admin lê todas.
create policy "membresia: ler a propria"
  on public.memberships for select
  using ( auth.uid() = user_id );

create policy "membresia: admin le todas"
  on public.memberships for select
  using ( public.is_admin() );

-- Só o admin altera membresias pela interface (o webhook usa service_role
-- e passa por cima disto). Repare: NAO ha politica de INSERT/UPDATE para
-- membro comum — logo, ele nao consegue se dar acesso.
create policy "membresia: admin gerencia"
  on public.memberships for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- Atalho seguro para o site perguntar "posso liberar conteudo pra este
-- usuario agora?" sem expor a tabela inteira.
create or replace function public.is_member_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid()
      and status = 'active'
      and (current_period_end is null or current_period_end > now())
  );
$$;


-- ============================================================
--  DEPOIS DE RODAR ESTE ARQUIVO:
--  Para tornar VOCÊ o primeiro administrador, cadastre-se normalmente
--  no site e depois rode, aqui no SQL Editor, com o seu e-mail:
--
--    update public.profiles set role = 'admin'
--    where email = 'seu-email@exemplo.com';
--
--  Faca isso pelo painel do Supabase (que usa permissao total), nunca
--  pelo site. É assim que "ninguem se promove sozinho" continua verdade.
-- ============================================================
