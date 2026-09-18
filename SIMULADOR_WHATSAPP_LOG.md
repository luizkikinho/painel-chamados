# Log — Simulador de WhatsApp (mock) para substituir a Evolution API

Registro do que foi feito na sessão de hoje (16/09/2026) nos projetos
`chamados_anonimos_backend` e `painel-chamados`.

## Objetivo
Permitir simular a parte do WhatsApp sem depender da Evolution API (conta
restrita): o usuário digita como "cidadão" numa tela web do próprio painel e o
fluxo do bot (LGPD, categoria, relato, protocolo, consulta) roda normalmente.
Desenho do canal fica isolado para troca futura pela API oficial do Meta.

---

## Backend — `chamados_anonimos_backend`

### `lib/evolution.js`
- Removido `throw` no boot (quebrava o servidor sem as envs da Evolution).
- Agora a validação é lazy: só falha quando `evofetch` é usado de verdade.

### `functions.js`
- Novo mecanismo do simulador (só em memória):
  - `transcricoes` — histórico das conversas simuladas.
  - `capturaAtiva` — quando ativo, as funções `send*` não disparam para a
    Evolution; só devolvem a mensagem para o simulador renderizar.
  - `conversaSimulada()`, `registrarTranscricao()`.
  - `processWebhook(payload, { simulacao })` — grava mensagem recebida e
    retorna o `outbox` (saída do bot).
- `sendWhatsappMessage/Buttons/List` passam a capturar a saída quando
  `capturaAtiva` está ativo (estrutura `texto`/`buttons`/`list` compatível com
  a tela).
- Novos exports: `processSimulatorMessage()`, `listarConversasSimuladas()`,
  `obterTranscricaoSimulada()`.
- Correção: `createTicket` agora grava `status: "aberto"` (antes `"NOVO"`,
  que o painel não reconhecia).

### `index.js`
- `POST /simular` — recebe `{ empresaId, numero, texto }` e devolve a saída do
  bot + transcrição (Bearer `PROVISION_SECRET`).
- `GET /simular/:empresaId` — lista conversas; com `?numero=...` devolve a
  transcrição daquela conversa.
- `POST /deploy-hook` e rota `/qr` inalterados.

---

## Painel — `painel-chamados`

### Edge Functions (Supabase)
- **Nova:** `supabase/functions/simular-whatsapp/`
  - `index.ts`: autentica em `administradores`, autoriza `super_admin`/master
    da empresa; `GET` lista conversas/transcrição; `POST` envia mensagem do
    cidadão para o backend (`KOYEB_BACKEND_URL` + `PROVISION_SECRET`).
  - `deno.json` + `.npmrc` copiados dos padrões do projeto.
- `supabase/config.toml`: adicionada entrada `[functions.simular-whatsapp]`.
- `create-empresa/index.ts`: `MOCK_MODE` — quando ativo (ou sem
  `KOYEB_BACKEND_URL`), cria instância `mock-<8 caracteres>` com
  `whatsapp_status = "connected"` e `qrBase64 = null`.
- `get-qr-empresa/index.ts`: `MOCK_MODE` — marca empresa como `connected` e
  retorna `qrBase64: null` (sem tentar chamar a Evolution).

### Frontend
- **Novo:** `src/pages/admin/SimuladorWhatsapp.tsx`
  - Seletor de empresa (super_admin) ou usa a empresa do usuário (master).
  - Lista de conversas (desktop + horizontal no mobile), chat com bolhas de
    texto, botões clicáveis (`buttons`) e listas (`list`), botão "copiar
    protocolo", nova conversa dispara `/start`, auto-scroll.
- `src/pages/App.tsx`: rota `/admin/whatsapp/simulador`.
- `src/components/app-sidebar.tsx`: item "Simulador WhatsApp" no `adminMenu`.
- `src/components/site-header.tsx`: botão "Simulador WhatsApp" no menu admin.
- `src/pages/admin/Whatsapp.tsx`: removido import `Label` não usado (quebrava
  o build).

---

## Validações executadas

- `npm run build` e `npx tsc --noEmit` no painel: **OK**.
- `npm run lint` no painel: arquivo novo **limpo** (32 problemas restantes são
  todos pré-existentes do projeto).
- `node --check` em `functions.js`, `index.js`, `lib/evolution.js`: **OK**.
- Teste de fluxo com Supabase mockado (harness descartável): `/start` →
  aceitar LGPD → menu → categoria → relato → confirmar → **chamado criado com
  `status: "aberto"`**; transcrição com 12 mensagens nas duas direções
  (cidadão + bot), lida via `listarConversasSimuladas`/`obterTranscricaoSimulada`.
- `npm install` executado no backend (dependências não estavam instaladas
  localmente; `node_modules/` gerado, untracked).

## Observação técnica
- O Supabase-js instalado (`^2.108.2`) não aceita a opção `query: {...}` no
  `invoke`. Solução: GET usa `invoke("simular-whatsapp?empresaId=...")` (o SDK
  monta a URL com os parâmetros).

---

## Pendências (deploy — exigem credenciais)

1. Backend no Koyeb com envs: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `SALT`,
   `PROVISION_SECRET` (Evolution opcional agora).
2. Deploy das EFs: `supabase functions deploy create-empresa get-qr-empresa simular-whatsapp`.
3. Secrets das EFs: `supabase secrets set KOYEB_BACKEND_URL=... PROVISION_SECRET=... MOCK_MODE=true`.
4. Fluxo de teste manual no painel (ver guia na conversa).

Nenhum commit foi feito (aguardando decisão do usuário). Arquivos modificados/
criados neste trabalho:

**Backend (modificado):**
- `functions.js`, `index.js`, `lib/evolution.js`

**Painel (modificado):**
- `src/pages/App.tsx`, `src/components/app-sidebar.tsx`,
  `src/components/site-header.tsx`, `src/pages/admin/Whatsapp.tsx`,
  `supabase/config.toml`, `supabase/functions/create-empresa/index.ts`,
  `supabase/functions/get-qr-empresa/index.ts`

**Painel (novo):**
- `src/pages/admin/SimuladorWhatsapp.tsx`,
  `supabase/functions/simular-whatsapp/`

---

# Sessão 2 (18/09/2026) — Mensagens do Bot + testes integrados

## Adições

### Painel — `painel-chamados`
- **Novo:** `src/lib/mensagensBot.ts` — catálogo das 32 mensagens editáveis do
  bot (as mesmas chaves usadas em `messageBuilder.js`/`messages.js`), em 7
  grupos.
- **Novo:** `src/pages/admin/MensagensBot.tsx` — seção "Mensagens do Bot" (a
  "voz do assistente" que a página prometia): textarea por mensagem, badge
  `Padrão`/`Personalizada`/`Alterado`, botão "Usar padrão", Salvar (upsert) e
  campo vazio = restaurar padrão. Acesso master (própria empresa) / super_admin.
- `src/pages/admin/Whatsapp.tsx`: seção `MensagensBot` renderizada abaixo das
  cards Conexão/Categorias.
- **Novo:** `supabase/rls_mensagens_bot.sql` — unique `(empresa_id, chave)`,
  grants para `service_role`/`authenticated` e políticas RLS.

> **Importante:** o script acima **foi rodado pelo usuário** no Supabase. Sem
> ele o backend dava `permission denied for table mensagens_bot` (a chave do
> backend é `service_role` correta, o que faltava eram os privilégios).

## Testes executados (todos via backend local :8000 + Supabase real)

Scripts em `/tmp/opencode/teste_integrado.js` e auxiliares. **23/23 PASS.**

### A) Caminhos que dependiam da Evolution API
- `GET /qr/:id` — token errado → `401`; token local → `500` "Falha ao obter
  QR" **sem crash** (Evolution isolada e falha graciosa).
- `POST /provisionar/:id` — token errado → `401` (guarda de auth antes de
  tocar a Evolution).
- `POST /webhook` `connection.update` — `close` → `awaiting_qr`; `open` →
  `connected` (status atualizado no banco, como a Evolution envia).

### B) Mensagens do Bot (override/fallback)
- Insert override de `menu_footer` → bot usou o texto personalizado.
- Update do override → bot usou o novo texto.
- Delete do override → bot voltou ao texto padrão.

### C) Adicionar chamado (fluxo completo)
- `/start` → LGPD → menu → Nova Denúncia → lista de categorias (8 linhas) →
  escolhe categoria → relato → confirmar → **protocolo gerado** + botão copiar.
- Chamado gravado em `chamados` com `status: "aberto"`, empresa/categoria
  corretas e texto do relato; `registro_chamados` com 1 linha.
- Consulta por protocolo: retorna atualizações + menu pós-relato.

### D) Separação por instância
- Empresa Simulada 02 com categorias próprias (diferentes da 01).

### Observações
- O bot grava o relato em **minúsculas** (normalização), comportamento correto
  (o teste foi ajustado, não houve bug).
- Chamados de teste criados na Empresa Simulada 01: `DEN-1381-E344`,
  `DEN-1647-1C29`, `DEN-7864-1E5F` (podem ser apagados após conferência).

## Arquivos adicionados/modificados nesta sessão

**Painel:**
- novo: `src/lib/mensagensBot.ts`, `src/pages/admin/MensagensBot.tsx`,
  `supabase/rls_mensagens_bot.sql`
- mod: `src/pages/admin/Whatsapp.tsx`

Backend seguia rodando na porta 8000. Nenhum commit feito.