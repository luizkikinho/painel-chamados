export interface MensagemBotPadrao {
  chave: string
  rotulo: string
  padrao: string
  dica?: string
}

export interface GrupoMensagensBot {
  titulo: string
  descricao?: string
  itens: MensagemBotPadrao[]
}

export const GRUPOS_MENSAGENS_BOT: GrupoMensagensBot[] = [
  {
    titulo: "Boas-vindas e LGPD",
    descricao:
      "Exibidos no primeiro contato, antes do cidadão aceitar os termos.",
    itens: [
      {
        chave: "welcome",
        rotulo: "Boas-vindas",
        padrao:
          "🛡️ *Bem-vindo ao Canal de Denúncias Seguro*\n\nEste é um ambiente confidencial e protegido. Antes de iniciarmos, precisamos do seu consentimento sobre como tratamos seus dados, de acordo com a LGPD.",
      },
      {
        chave: "termos_completos",
        rotulo: "Termos completos (LGPD)",
        padrao:
          "📄 *Termos de Privacidade (LGPD)*\n\nGarantimos o absoluto sigilo e anonimato de todas as informações compartilhadas aqui. Seu número de telefone não será exposto aos investigadores.\n\n👇 Por favor, utilize os botões abaixo para confirmar sua leitura e aceitar os termos.",
      },
      {
        chave: "lgpd_title",
        rotulo: "Título do card LGPD",
        padrao: "📋 Antes de continuar, leia os Termos de Uso!",
      },
      {
        chave: "lgpd_description",
        rotulo: "Descrição do card LGPD",
        padrao:
          "Para garantir o seu anonimato e cumprir com a LGPD, precisamos que você confirme nossos termos de uso antes de prosseguir.",
      },
      {
        chave: "lgpd_footer",
        rotulo: "Rodapé do card LGPD",
        padrao: "Nenhum dado pessoal será armazenado!",
      },
    ],
  },
  {
    titulo: "Menu principal",
    descricao: "Card com os botões Nova Denúncia, Consultar Ticket e Encerrar.",
    itens: [
      {
        chave: "menu_title",
        rotulo: "Título do menu",
        padrao: "MENU PRINCIPAL",
      },
      {
        chave: "menu_description",
        rotulo: "Descrição do menu",
        padrao: "Como podemos ajudar?",
      },
      {
        chave: "menu_footer",
        rotulo: "Rodapé do menu",
        padrao: "Selecione uma opção para continuar.",
      },
    ],
  },
  {
    titulo: "Categorias",
    descricao: "Lista de temas de denúncia oferecida pelo bot (por empresa).",
    itens: [
      {
        chave: "categoria_title",
        rotulo: "Título da lista",
        padrao: "📂 Categorias de Denúncia",
      },
      {
        chave: "categoria_description",
        rotulo: "Descrição da lista",
        padrao: "Por favor, selecione o tema que melhor descreve o seu relato.",
      },
      {
        chave: "categoria_button",
        rotulo: "Botão que abre a lista",
        padrao: "Ver Categorias",
      },
      {
        chave: "categoria_footer",
        rotulo: "Rodapé da lista",
        padrao: "Seu anonimato é garantido.",
      },
    ],
  },
  {
    titulo: "Relato e confirmação",
    descricao: "Solicitação do relato e pedido de confirmação antes de salvar.",
    itens: [
      {
        chave: "pedir_relato",
        rotulo: "Pedido de relato",
        padrao:
          "✍️ *Descreva a situação*\n\nPor favor, digite o seu relato na mensagem abaixo. Para nos ajudar na investigação, tente detalhar o máximo possível:\n\n• O que aconteceu?\n• Quando e onde ocorreu?\n• Quem são os envolvidos?\n\n_Fique tranquilo(a), seu anonimato é garantido._",
      },
      {
        chave: "relato_curto",
        rotulo: "Relato muito curto",
        padrao:
          "⚠️ *Relato muito curto*\n\nPara que possamos abrir uma investigação adequada, precisamos de um pouco mais de contexto. Por favor, reescreva seu relato adicionando mais detalhes importantes.",
      },
      {
        chave: "pedir_relato_novamente",
        rotulo: "Após escolher reescrever",
        padrao:
          "🔄 *Reescrevendo...*\n\nEntendido. O seu rascunho anterior foi apagado da nossa memória. Pode digitar o seu novo relato detalhado logo abaixo:",
      },
      {
        chave: "confirmar_title",
        rotulo: "Título da confirmação",
        padrao: "✅ Confirme se está tudo certo",
      },
      {
        chave: "confirmar_description",
        rotulo: "Descrição da confirmação",
        padrao:
          "Confira se o relato está tudo certo e clique em `Confirmar` para salvar sua denúncia.",
      },
      {
        chave: "confirmar_footer",
        rotulo: "Rodapé da confirmação",
        padrao: "Ou clique em 'Cancelar' para reescrever seu relato",
      },
    ],
  },
  {
    titulo: "Ticket e protocolo",
    descricao: "Emissão do protocolo e consulta de denúncia existente.",
    itens: [
      {
        chave: "pedir_protocolo",
        rotulo: "Pedido de protocolo",
        padrao:
          "🔎 *Consultar Protocolo*\n\nPor favor, digite o número do protocolo que você recebeu no momento da denúncia (exemplo: *DEN-1234-ABCD*).",
      },
      {
        chave: "ticket_nao_encontrado",
        rotulo: "Protocolo não encontrado",
        padrao:
          "⚠️ *Protocolo não encontrado*\n\nNão localizamos nenhum chamado com esse código. Verifique se você digitou corretamente (incluindo o 'DEN-') e tente novamente.",
      },
      {
        chave: "ticket_title",
        rotulo: "Título do ticket",
        padrao: "🎟️ Guarde seu ticket!",
      },
      {
        chave: "ticket_description",
        rotulo: "Descrição do ticket",
        padrao:
          "Seu número de protocolo é {protocolo}. Guarde esse código em um local seguro. Ele será a única forma de consultar o andamento da sua denúncia no futuro",
        dica: "{protocolo} é substituído automaticamente pelo número do protocolo.",
      },
      {
        chave: "ticket_footer",
        rotulo: "Rodapé do ticket",
        padrao: "Canal de Denúncias Seguro",
      },
    ],
  },
  {
    titulo: "Pós-relato e encerramento",
    descricao: "Mensagens após salvar, cancelar ou encerrar o atendimento.",
    itens: [
      {
        chave: "pos_relato_title",
        rotulo: "Título pós-relato",
        padrao: "O que fazer agora?",
      },
      {
        chave: "pos_relato_footer",
        rotulo: "Rodapé pós-relato",
        padrao: "Canal de Denúncias Seguro",
      },
      {
        chave: "despedida",
        rotulo: "Atendimento encerrado",
        padrao:
          "🔒 *Atendimento Encerrado*\n\nAgradecemos a sua confiança e a coragem em utilizar nosso Canal Seguro. \n\nSua sessão foi encerrada e todos os dados de navegação foram apagados do nosso sistema para a sua segurança. Até logo!",
      },
      {
        chave: "cancelada",
        rotulo: "Operação cancelada",
        padrao:
          "🚫 *Operação Cancelada*\n\nO processo foi interrompido e nenhuma informação sua foi gravada. Sua privacidade está mantida. Se precisar relatar algo no futuro, basta mandar um *Oi*.",
      },
    ],
  },
  {
    titulo: "Avisos e erros",
    descricao:
      "Respostas quando o cidadão digita algo fora do esperado ou o sistema falha.",
    itens: [
      {
        chave: "use_os_botoes",
        rotulo: "Use os botões",
        padrao:
          "👇 Por favor, interaja clicando nos *botões* da mensagem acima para que possamos continuar.",
      },
      {
        chave: "use_a_lista",
        rotulo: "Use a lista",
        padrao:
          "📋 Por favor, selecione uma opção clicando no *menu* acima em vez de digitar.",
      },
      {
        chave: "limite_erros",
        rotulo: "Sessão encerrada por segurança",
        padrao:
          "🔒 *Sessão Encerrada por Segurança*\n\nComo não recebemos a resposta no formato esperado, encerramos este atendimento automaticamente para proteger sua navegação. Para recomeçar, basta enviar uma nova mensagem.",
      },
      {
        chave: "erro_banco",
        rotulo: "Erro temporário",
        padrao:
          "🚨 *Erro de Comunicação*\n\nTivemos um pequeno problema temporário ao carregar as informações. Nenhuma informação sua foi exposta. Por favor, aguarde alguns instantes e envie a mensagem novamente.",
      },
      {
        chave: "erro_sistema",
        rotulo: "Falha técnica",
        padrao:
          "🚨 *Falha Técnica*\n\nHouve um problema no sistema ao processar sua solicitação. Fique tranquilo(a), seus dados continuam seguros. Por favor, tente novamente mais tarde.",
      },
    ],
  },
]

export function mensagensPorChave(): Record<string, MensagemBotPadrao> {
  const mapa: Record<string, MensagemBotPadrao> = {}
  for (const grupo of GRUPOS_MENSAGENS_BOT) {
    for (const item of grupo.itens) {
      mapa[item.chave] = item
    }
  }
  return mapa
}