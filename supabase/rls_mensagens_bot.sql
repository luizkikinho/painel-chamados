-- ============================================================================
-- Mensagens do Bot (mensagens_bot) — RLS, grants e constraint
-- Rode no SQL Editor do Supabase (Dashboard > SQL Editor).
--
-- Necessário para que o painel consiga LER e GRAVAR as mensagens
-- personalizadas de cada empresa (tela "Mensagens do Bot" na página WhatsApp).
-- Também corrige o "permission denied for table mensagens_bot" do backend.
-- ============================================================================

-- 1) Garante chave única por empresa (impede duplicar a mesma mensagem)
alter table public.mensagens_bot
  drop constraint if exists mensagens_bot_empresa_id_chave_key;
alter table public.mensagens_bot
  add constraint mensagens_bot_empresa_id_chave_key unique (empresa_id, chave);

-- 2) Privilégios de tabela
--    service_role = chave do backend (getBotTexts lê os overrides por empresa)
--    authenticated = usuários logados no painel
grant select, insert, update, delete on public.mensagens_bot to service_role;
grant select, insert, update, delete on public.mensagens_bot to authenticated;

-- 3) RLS
alter table public.mensagens_bot enable row level security;

-- SELECT: master só vê mensagens da própria empresa; super_admin vê tudo.
drop policy if exists mensagens_bot_select on public.mensagens_bot;
create policy mensagens_bot_select on public.mensagens_bot
  for select
  to authenticated
  using (
    exists (
      select 1 from public.administradores a
      where a.id = auth.uid()
        and (a.cargo = 'super_admin' or a.empresa_id = empresa_id)
    )
  );

-- INSERT: só para a própria empresa (master) ou qualquer (super_admin).
drop policy if exists mensagens_bot_insert on public.mensagens_bot;
create policy mensagens_bot_insert on public.mensagens_bot
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.administradores a
      where a.id = auth.uid()
        and (a.cargo = 'super_admin' or a.empresa_id = empresa_id)
    )
  );

-- UPDATE:
drop policy if exists mensagens_bot_update on public.mensagens_bot;
create policy mensagens_bot_update on public.mensagens_bot
  for update
  to authenticated
  using (
    exists (
      select 1 from public.administradores a
      where a.id = auth.uid()
        and (a.cargo = 'super_admin' or a.empresa_id = empresa_id)
    )
  )
  with check (
    exists (
      select 1 from public.administradores a
      where a.id = auth.uid()
        and (a.cargo = 'super_admin' or a.empresa_id = empresa_id)
    )
  );

-- DELETE:
drop policy if exists mensagens_bot_delete on public.mensagens_bot;
create policy mensagens_bot_delete on public.mensagens_bot
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.administradores a
      where a.id = auth.uid()
        and (a.cargo = 'super_admin' or a.empresa_id = empresa_id)
    )
  );

-- ----------------------------------------------------------------------------
-- Obs. sobre o backend: se depois disso ainda aparecer
-- "permission denied for table mensagens_bot" no log do servidor,
-- a chave em chamados_anonimos_backend/.env não é a service_role real
-- (parece ser anon/authenticated). Troque SUPABASE_SERVICE_ROLE pela chave
-- com função `service_role` (Dashboard > Settings > API Keys).
-- ----------------------------------------------------------------------------