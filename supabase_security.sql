-- ==============================================================================
-- SEGURANÇA EL SHADDAY (v2) — login real + regras de acesso no banco
-- ==============================================================================
-- COMO USAR (uma vez só, no SQL Editor do Supabase):
--   1. Troque a senha na ÚLTIMA linha deste arquivo (procure "TROQUE_ESTA_SENHA").
--   2. Rode o arquivo inteiro.
--   3. Entre no painel com usuário "admin" e a senha que você escolheu.
--      Recrie os outros usuários (gerentes/cozinha) em Painel > Usuários.
--
-- O que muda:
--   * Senhas ficam no Supabase Auth (criptografadas), não mais no navegador.
--   * Visitante só consegue: ler cardápio/galeria/config pública, CRIAR pedido
--     novo e CRIAR orçamento. Não lê pedidos nem dados de clientes.
--   * Só a equipe logada lê/altera pedidos e configurações.
--   * Sessão do WhatsApp e lista de clientes saem da tabela pública.
--   * Número do pedido passa a ser gerado pelo banco (não repete/sobrescreve).
--
-- Pode rodar de novo sem problemas (idempotente).
-- ==============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------------------------
-- 1. USUÁRIOS DA EQUIPE ligados ao Supabase Auth
-- ------------------------------------------------------------------------------
alter table public.app_users add column if not exists auth_user_id uuid unique;
alter table public.app_users alter column password drop not null;
update public.app_users set password = null where password is not null;

-- Perfil do usuário logado (null para visitantes)
create or replace function public.staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.app_users
  where auth_user_id = auth.uid() and active = true
  limit 1
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.staff_role() is not null
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.staff_role() in ('SUPER_ADMIN', 'BRANCH_ADMIN'), false)
$$;

create or replace function public.is_master()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.staff_role() = 'SUPER_ADMIN', false)
$$;

-- E-mail interno usado só para o login (ninguém recebe e-mail)
create or replace function public._staff_email(p_username text)
returns text language sql immutable as $$
  select lower(trim(p_username)) || '@elshadday.local'
$$;

create or replace function public._clean_username(p_username text)
returns text language plpgsql immutable as $$
declare v text := lower(trim(coalesce(p_username, '')));
begin
  if v !~ '^[a-z0-9._-]{2,40}$' then
    raise exception 'Usuário inválido: use de 2 a 40 letras minúsculas, números, ponto, hífen ou _ (sem espaços/acentos).';
  end if;
  return v;
end $$;

create or replace function public._check_password(p_password text)
returns text language plpgsql immutable as $$
begin
  if p_password is null or length(trim(p_password)) < 6 then
    raise exception 'A senha deve ter pelo menos 6 caracteres.';
  end if;
  return trim(p_password);
end $$;

-- Cria (ou atualiza a senha de) um login no Supabase Auth. Uso interno.
create or replace function public._upsert_auth_user(p_email text, p_password text)
returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = p_email limit 1;
  if v_id is not null then
    update auth.users
       set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_id;
    return v_id;
  end if;

  v_id := gen_random_uuid();
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
  return v_id;
end $$;

create or replace function public._user_json(u public.app_users)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'id', u.id, 'username', u.username, 'name', u.name, 'role', u.role,
    'branchId', u.branch_id, 'branchName', u.branch_name, 'active', u.active,
    'createdAt', u.created_at, 'updatedAt', u.updated_at)
$$;

-- Perfil do usuário logado
create or replace function public.my_profile()
returns jsonb language sql stable security definer set search_path = public as $$
  select public._user_json(u) from public.app_users u
  where u.auth_user_id = auth.uid() and u.active = true limit 1
$$;

-- Lista de usuários (Admin Master vê todos; demais só a si mesmos)
create or replace function public.list_app_users()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(public._user_json(u) order by u.created_at), '[]'::jsonb)
  from public.app_users u
  where public.is_master() or u.auth_user_id = auth.uid()
$$;

create or replace function public.admin_create_user(
  p_username text, p_password text, p_name text, p_role text, p_branch_id text, p_branch_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user text; v_pass text; v_auth uuid; v_row public.app_users;
  v_role text := coalesce(nullif(p_role, ''), 'BRANCH_ADMIN');
begin
  if not public.is_master() then raise exception 'Apenas o Admin Master pode criar usuários.'; end if;
  if v_role not in ('SUPER_ADMIN', 'BRANCH_ADMIN', 'KITCHEN') then raise exception 'Perfil inválido.'; end if;
  v_user := public._clean_username(p_username);
  v_pass := public._check_password(p_password);
  if exists (select 1 from public.app_users where username = v_user) then
    raise exception 'O usuário "%" já existe no sistema.', v_user;
  end if;
  v_auth := public._upsert_auth_user(public._staff_email(v_user), v_pass);
  insert into public.app_users (id, username, name, role, branch_id, branch_name, password, active, auth_user_id)
  values (
    'user_' || replace(gen_random_uuid()::text, '-', ''), v_user,
    coalesce(nullif(trim(p_name), ''), v_user), v_role,
    case when v_role = 'SUPER_ADMIN' then 'all' else coalesce(nullif(p_branch_id, ''), 'ariquemes') end,
    case when v_role = 'SUPER_ADMIN' then 'Todas as Filiais (Global)' else coalesce(nullif(p_branch_name, ''), 'Unidade Ariquemes') end,
    null, true, v_auth)
  returning * into v_row;
  return public._user_json(v_row);
end $$;

-- p_updates aceita: username, name, role, branchId, branchName, active, password
create or replace function public.admin_update_user(p_id text, p_updates jsonb)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_row public.app_users; v_user text; v_role text; v_is_self boolean;
begin
  select * into v_row from public.app_users where id = p_id;
  if v_row.id is null then raise exception 'Usuário não encontrado.'; end if;
  v_is_self := v_row.auth_user_id = auth.uid();

  -- Usuário comum só pode trocar a própria senha
  if not public.is_master() then
    if not v_is_self or exists (select 1 from jsonb_object_keys(p_updates) k where k <> 'password') then
      raise exception 'Apenas o Admin Master pode alterar usuários.';
    end if;
  end if;

  if p_updates ? 'username' then
    v_user := public._clean_username(p_updates->>'username');
    if exists (select 1 from public.app_users where username = v_user and id <> p_id) then
      raise exception 'A tag/usuário "%" já está em uso por outra conta.', v_user;
    end if;
    if v_row.auth_user_id is not null then
      update auth.users set email = public._staff_email(v_user), updated_at = now() where id = v_row.auth_user_id;
      update auth.identities
         set identity_data = identity_data || jsonb_build_object('email', public._staff_email(v_user))
       where user_id = v_row.auth_user_id and provider = 'email';
    end if;
    v_row.username := v_user;
  end if;

  if p_updates ? 'password' and coalesce(trim(p_updates->>'password'), '') <> '' then
    if v_row.auth_user_id is null then
      v_row.auth_user_id := public._upsert_auth_user(public._staff_email(v_row.username), public._check_password(p_updates->>'password'));
    else
      update auth.users
         set encrypted_password = extensions.crypt(public._check_password(p_updates->>'password'), extensions.gen_salt('bf')),
             updated_at = now()
       where id = v_row.auth_user_id;
    end if;
  end if;

  if p_updates ? 'name' and coalesce(trim(p_updates->>'name'), '') <> '' then v_row.name := trim(p_updates->>'name'); end if;
  if p_updates ? 'role' then
    v_role := p_updates->>'role';
    if v_role not in ('SUPER_ADMIN', 'BRANCH_ADMIN', 'KITCHEN') then raise exception 'Perfil inválido.'; end if;
    if v_row.role = 'SUPER_ADMIN' and v_role <> 'SUPER_ADMIN'
       and (select count(*) from public.app_users where role = 'SUPER_ADMIN' and active) <= 1 then
      raise exception 'Não é possível rebaixar o único Admin Master do sistema.';
    end if;
    v_row.role := v_role;
  end if;
  if p_updates ? 'branchId' then v_row.branch_id := p_updates->>'branchId'; end if;
  if p_updates ? 'branchName' then v_row.branch_name := p_updates->>'branchName'; end if;
  if v_row.role = 'SUPER_ADMIN' then
    v_row.branch_id := 'all';
    v_row.branch_name := 'Todas as Filiais (Global)';
  end if;
  if p_updates ? 'active' then
    if (p_updates->>'active')::boolean = false and v_row.role = 'SUPER_ADMIN'
       and (select count(*) from public.app_users where role = 'SUPER_ADMIN' and active) <= 1 then
      raise exception 'Não é possível desativar o único Admin Master do sistema.';
    end if;
    v_row.active := (p_updates->>'active')::boolean;
  end if;

  update public.app_users set
    username = v_row.username, name = v_row.name, role = v_row.role,
    branch_id = v_row.branch_id, branch_name = v_row.branch_name, active = v_row.active,
    auth_user_id = v_row.auth_user_id, updated_at = now()
  where id = p_id
  returning * into v_row;
  return public._user_json(v_row);
end $$;

create or replace function public.admin_delete_user(p_id text)
returns boolean language plpgsql security definer set search_path = public, auth as $$
declare v_row public.app_users;
begin
  if not public.is_master() then raise exception 'Apenas o Admin Master pode excluir usuários.'; end if;
  select * into v_row from public.app_users where id = p_id;
  if v_row.id is null then raise exception 'Usuário não encontrado.'; end if;
  if v_row.role = 'SUPER_ADMIN' and (select count(*) from public.app_users where role = 'SUPER_ADMIN') <= 1 then
    raise exception 'Não é possível excluir o único Admin Master do sistema.';
  end if;
  delete from public.app_users where id = p_id;
  if v_row.auth_user_id is not null then
    delete from auth.users where id = v_row.auth_user_id;
  end if;
  return true;
end $$;

-- Cria/atualiza o Admin Master. SÓ pode ser executada aqui no SQL Editor.
create or replace function public.setup_master_admin(p_username text, p_password text)
returns text language plpgsql security definer set search_path = public as $$
declare v_user text; v_auth uuid;
begin
  if p_password is null or p_password = 'TROQUE_ESTA_SENHA' then
    raise exception 'Troque "TROQUE_ESTA_SENHA" pela senha do Admin Master antes de rodar.';
  end if;
  v_user := public._clean_username(p_username);
  v_auth := public._upsert_auth_user(public._staff_email(v_user), public._check_password(p_password));
  insert into public.app_users (id, username, name, role, branch_id, branch_name, password, active, auth_user_id)
  values ('user_master_01', v_user, 'Administrador Master', 'SUPER_ADMIN', 'all', 'Todas as Filiais (Global)', null, true, v_auth)
  on conflict (id) do update set username = excluded.username, role = 'SUPER_ADMIN', branch_id = 'all',
    branch_name = excluded.branch_name, active = true, auth_user_id = excluded.auth_user_id, password = null, updated_at = now();
  return 'Admin Master pronto: entre com o usuário "' || v_user || '".';
end $$;

-- Funções internas/administrativas: ninguém de fora chama direto
revoke all on function public._upsert_auth_user(text, text) from public, anon, authenticated;
revoke all on function public.setup_master_admin(text, text) from public, anon, authenticated;
revoke all on function public._user_json(public.app_users) from public, anon;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.list_app_users() to authenticated;
grant execute on function public.admin_create_user(text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_update_user(text, jsonb) to authenticated;
grant execute on function public.admin_delete_user(text) to authenticated;
revoke all on function public.admin_create_user(text, text, text, text, text, text) from anon;
revoke all on function public.admin_update_user(text, jsonb) from anon;
revoke all on function public.admin_delete_user(text) from anon;

-- ------------------------------------------------------------------------------
-- 2. DADOS PRIVADOS (sessão do WhatsApp, clientes, canal da ponte)
-- ------------------------------------------------------------------------------
create table if not exists public.private_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

revoke all on public.private_settings from anon;
grant select, insert, update, delete on public.private_settings to authenticated;

-- Migra a sessão do WhatsApp para fora da tabela pública
insert into public.private_settings (id, data)
select 'whatsapp_session', card_machine_settings
from public.company_settings where id = 'el_shadday_whatsapp_session'
on conflict (id) do update set data = excluded.data, updated_at = now();
delete from public.company_settings where id = 'el_shadday_whatsapp_session';

-- Migra a lista de clientes (nomes/telefones/endereços) para fora da config pública
insert into public.private_settings (id, data)
select 'customers_directory', jsonb_build_object('customers', card_machine_settings->'customers_directory')
from public.company_settings
where id = 'el_shadday_config' and card_machine_settings ? 'customers_directory'
on conflict (id) do update set data = excluded.data, updated_at = now();
update public.company_settings
   set card_machine_settings = (card_machine_settings - 'customers_directory') - 'baileys_cloud_auth'
 where id = 'el_shadday_config';

-- Nome secreto do canal da ponte WhatsApp (QR Code não fica mais num canal público)
insert into public.private_settings (id, data)
values ('whatsapp_bridge', jsonb_build_object('topic', 'wa_bridge_' || encode(extensions.gen_random_bytes(16), 'hex')))
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- 3. NÚMERO DO PEDIDO gerado pelo banco (antes cada celular começava do #01
--    e sobrescrevia o pedido de outro cliente)
-- ------------------------------------------------------------------------------
create sequence if not exists public.order_number_seq;
select setval('public.order_number_seq', greatest(
  (select coalesce(max(id::bigint), 0) from public.orders where id ~ '^[0-9]{1,9}$'),
  (select last_value from public.order_number_seq),
  1));

create or replace function public.next_order_number()
returns bigint language plpgsql volatile security definer set search_path = public as $$
declare n bigint;
begin
  loop
    n := nextval('public.order_number_seq');
    exit when not exists (select 1 from public.orders where id = lpad(n::text, 2, '0') or id = n::text);
  end loop;
  return n;
end $$;
grant execute on function public.next_order_number() to anon, authenticated;

alter table public.orders add column if not exists payment_status text;

-- ------------------------------------------------------------------------------
-- 4. REGRAS DE ACESSO (RLS) — remove as regras antigas "acesso público a tudo"
-- ------------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('orders', 'buffet_quotes', 'buffet_gallery', 'company_settings',
                        'branches', 'app_users', 'private_settings')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.orders enable row level security;
alter table public.buffet_quotes enable row level security;
alter table public.buffet_gallery enable row level security;
alter table public.company_settings enable row level security;
alter table public.branches enable row level security;
alter table public.app_users enable row level security;
alter table public.private_settings enable row level security;

-- Pedidos: cliente só CRIA pedido novo; equipe faz tudo
create policy orders_customer_insert on public.orders for insert to anon, authenticated
  with check (status = 'RECEBIDO_COZINHA' and shift_closed_at is null);
create policy orders_staff_all on public.orders for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Orçamentos do buffet: cliente só cria; equipe faz tudo
create policy quotes_customer_insert on public.buffet_quotes for insert to anon, authenticated
  with check (status = 'PENDENTE');
create policy quotes_staff_all on public.buffet_quotes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Galeria: todos veem; equipe altera
create policy gallery_public_read on public.buffet_gallery for select to anon, authenticated using (true);
create policy gallery_staff_write on public.buffet_gallery for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Configurações: todos leem só a linha pública da loja; equipe altera
create policy settings_public_read on public.company_settings for select to anon, authenticated
  using (id = 'el_shadday_config');
create policy settings_staff_all on public.company_settings for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Filiais: todos veem; só o Admin Master altera
create policy branches_public_read on public.branches for select to anon, authenticated using (true);
create policy branches_master_write on public.branches for all to authenticated
  using (public.is_master()) with check (public.is_master());

-- Usuários: cada um lê o próprio cadastro (o resto passa pelas funções acima)
create policy app_users_self_read on public.app_users for select to authenticated
  using (auth_user_id = auth.uid());

-- Dados privados: equipe lê/grava, EXCETO a sessão do WhatsApp (só o motor, com a chave service_role)
create policy private_staff_all on public.private_settings for all to authenticated
  using (public.is_staff() and id <> 'whatsapp_session')
  with check (public.is_staff() and id <> 'whatsapp_session');

-- Realtime da tabela privada (lista de clientes entre aparelhos da equipe)
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'private_settings') then
    alter publication supabase_realtime add table public.private_settings;
  end if;
exception when others then
  raise notice 'Realtime de private_settings não habilitado: %', sqlerrm;
end $$;

-- ------------------------------------------------------------------------------
-- 5. FOTOS (Storage, bucket "gallery"): todos veem; só a equipe envia/apaga
-- ------------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
  create policy gallery_files_public_read on storage.objects for select to anon, authenticated
    using (bucket_id = 'gallery');
  create policy gallery_files_staff_insert on storage.objects for insert to authenticated
    with check (bucket_id = 'gallery' and public.is_staff());
  create policy gallery_files_staff_update on storage.objects for update to authenticated
    using (bucket_id = 'gallery' and public.is_staff());
  create policy gallery_files_staff_delete on storage.objects for delete to authenticated
    using (bucket_id = 'gallery' and public.is_staff());
exception when others then
  raise notice 'Regras do Storage não aplicadas (faça pelo painel Storage > Policies): %', sqlerrm;
end $$;

-- ------------------------------------------------------------------------------
-- 6. ADMIN MASTER — TROQUE A SENHA ABAIXO (mínimo 6 caracteres) E RODE
-- ------------------------------------------------------------------------------
select public.setup_master_admin('admin', 'TROQUE_ESTA_SENHA');
