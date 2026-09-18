-- ============================================================================
-- chamados_painel (view) — GRANT SELECT
-- Rode no SQL Editor do Supabase (Dashboard > SQL Editor).
--
-- Corrige: página de chamados vazia (sem erro), dashboard e "todos os
-- chamados" não listam nada. O backend também não consegue ler a view
-- (permission denied for view chamados_painel).
-- ============================================================================

-- 1) Permite o painel (authenticated) e o backend (service_role) lerem a view.
--    `anon` incluído por precaução (same behavior de outras views do projeto).
grant select on public.chamados_painel to anon, authenticated, service_role;

-- 2) Garante SELECT nas tabelas-base caso a view seja security_invoker
--    (depende da role que executa a view). Inofensivo se já concedido.
grant select on public.chamados, public.registro_chamados to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Confira o resultado depois:
--   select count(*) from public.chamados_painel;
-- Deve mostrar os chamados (7 neste ambiente de teste).
-- ----------------------------------------------------------------------------