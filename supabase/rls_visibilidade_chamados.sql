-- ============================================================================
-- Visibilidade de chamados: apenas o agente atribuido pode ver o chamado
--
-- Objetivo: um chamado so deve ser exibido para quem esta atribuido a ele.
--
-- Regras de visibilidade (inside a view chamados_painel, security_invoker):
--   * NAO atribuido (agente_responsavel_id IS NULL) -> visivel a todos os
--     autenticados (fila de "atender" / chamados abertos)
--   * Atribuido   (agente_responsavel_id = auth.uid()) -> SOMENTE ao agente
--   * permissao_compartilhar = true                  -> visivel (compartilhado)
--   * cargo super_admin                              -> ve tudo
--
-- Acesso de escrita:
--   * Atender (assumir): abre para qualquer autenticado que enxergue um
--     chamado nao atribuido; apos atribuir, agente_responsavel_id = auth.uid().
--   * Responder/concluir: somente quem agente_responsavel_id = auth.uid().
-- ============================================================================

-- 0) Grants de leitura nas tabelas que a view consulta
--    (necessarios quando a view roda como o usuario logado).
grant select on public.chamados, public.registro_chamados,
                public.categorias, public.empresas, public.administradores
  to authenticated, service_role;

-- 1) A view passa a executar com a role do usuario, para que as policies
--    das tabelas-base valham dentro da view.
alter view public.chamados_painel set (security_invoker = on);

-- 2) Habilita RLS nas tabelas-base
alter table public.chamados enable row level security;
alter table public.registro_chamados enable row level security;

-- ----------------------------------------------------------------------------
-- 2.1) Remove TODAS as policies pre-existentes dessas tabelas.
--      O painel gerava policies antigas (ex.: UPDATE restrito por empresa_id),
--      que bloqueavam o "Atender" silenciosamente. Aqui limpamos tudo para
--      aplicar a nova matriz de visibilidade de forma limpa e idempotente.
-- ----------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('chamados', 'registro_chamados')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- 3.1) chamados — SELECT
--      Enxerga apenas: nao atribuido | atribuido a mim | compartilhado | super_admin
drop policy if exists "chamados_visibilidade_select" on public.chamados;
create policy "chamados_visibilidade_select" on public.chamados
  for select
  using (
    agente_responsavel_id is null
    or agente_responsavel_id = auth.uid()
    or permissao_compartilhar = true
    or exists (
      select 1 from public.administradores a
      where a.id = auth.uid() and a.cargo = 'super_admin'
    )
  );

-- 3.2) chamados — UPDATE
--      Assumir (atender) um chamado nao atribuido OU gerenciar os meus.
--      Bloqueia repassar/roubar um chamado de outro agente.
drop policy if exists "chamados_gerenciar_update" on public.chamados;
create policy "chamados_gerenciar_update" on public.chamados
  for update
  using (
    agente_responsavel_id is null
    or agente_responsavel_id = auth.uid()
    or exists (
      select 1 from public.administradores a
      where a.id = auth.uid() and a.cargo = 'super_admin'
    )
  )
  with check (
    agente_responsavel_id = auth.uid()
    or exists (
      select 1 from public.administradores a
      where a.id = auth.uid() and a.cargo = 'super_admin'
    )
  );

-- 3.3) registro_chamados — SELECT (historico somente de chamados visiveis)
drop policy if exists "registro_select" on public.registro_chamados;
create policy "registro_select" on public.registro_chamados
  for select
  using (
    exists (
      select 1 from public.chamados c
      where c.id = id_chamado
        and (
          c.agente_responsavel_id = auth.uid()
          or c.agente_responsavel_id is null
          or c.permissao_compartilhar = true
          or exists (
            select 1 from public.administradores a
            where a.id = auth.uid() and a.cargo = 'super_admin'
          )
        )
    )
  );

-- 3.4) registro_chamados — INSERT (respostas/registros apenas em chamados meus)
drop policy if exists "registro_insert" on public.registro_chamados;
create policy "registro_insert" on public.registro_chamados
  for insert
  with check (
    exists (
      select 1 from public.chamados c
      where c.id = id_chamado
        and (
          c.agente_responsavel_id = auth.uid()
          or exists (
            select 1 from public.administradores a
            where a.id = auth.uid() and a.cargo = 'super_admin'
          )
        )
    )
  );

-- ----------------------------------------------------------------------------
-- Depois, valide no SQL Editor:
--   select count(*) from public.chamados_painel;      -> 7 (neste ambiente)
--   select count(*) from public.chamados_painel
--     where agente_responsavel_id is null;            -> 7 (fila disponivel)
-- ----------------------------------------------------------------------------