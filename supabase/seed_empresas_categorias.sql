-- =====================================================================
-- Seed local de teste: 2 empresas + categorias para o Simulador WhatsApp
-- Rodar no Supabase (SQL Editor). É idempotente (pode rodar de novo).
-- =====================================================================

WITH novas AS (
  -- Cria as empresas (ou reativa/re-conecta se já existirem pelo nome).
  -- instance_name é UNIQUE; usamos nomes mock locais, validos apenas para
  -- o simulador (o backend não depende mais de instância real).
  INSERT INTO public.empresas (name, status, instance_name, whatsapp_status, created_at)
  VALUES
    ('Empresa Simulada 01', true, 'mock-local-01', 'connected', now()),
    ('Empresa Simulada 02', true, 'mock-local-02', 'connected', now())
  ON CONFLICT (name) DO UPDATE
    SET status = true,
        whatsapp_status = 'connected'
  RETURNING id, name
)
-- Insere categorias ativas para cada empresa, sem duplicar.
INSERT INTO public.categorias (name, empresa_id, active)
SELECT c.nome, n.id, true
FROM novas n
CROSS JOIN (VALUES
  ('Assédio'),
  ('Corrupção'),
  ('Irregularidades trabalhistas'),
  ('Segurança pública'),
  ('Meio ambiente'),
  ('Má conduta profissional'),
  ('Outros')
) AS c(nome)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categorias x
  WHERE x.empresa_id = n.id
    AND x.name = c.nome
);

-- Conferência (opcional):
-- SELECT e.name AS empresa, e.status, e.instance_name, e.whatsapp_status,
--        count(c.id) AS categorias
-- FROM public.empresas e
-- LEFT JOIN public.categorias c ON c.empresa_id = e.id
-- WHERE e.name IN ('Empresa Simulada 01', 'Empresa Simulada 02')
-- GROUP BY e.id
-- ORDER BY e.name;