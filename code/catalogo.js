/* =========================================================
   CATÁLOGO — edite este arquivo para atualizar unidades,
   servidores, processos, atividades e complexidades.
   Pontuação por complexidade: baixa = 5, média = 10, alta = 15.
   Em cada atividade, "c" lista as complexidades permitidas:
   "b" (baixa), "m" (média), "a" (alta).
   ========================================================= */

const PONTOS = { b: 5, m: 10, a: 15 };
const ROTULO_COMPLEXIDADE = { b: "Baixa", m: "Média", a: "Alta" };

/* Meta de pontos por DIA TRABALHADO, conforme a carga horária diária.
   Quem cumpre 8h tem meta de 15 pontos/dia; quem cumpre 6h, 11.
   O percentual alcançado é medido só nos dias em que houve lançamento
   (ver LEIA-ME: dias vazios e dias de ausência ficam de fora). */
const META_DIARIA = { 8: 15, 6: 11 };

/* Tipos de ausência registráveis por período (a partir da v11).
   Edite à vontade: a chave "k" é o que fica gravado no arquivo da
   pessoa, então NÃO troque chaves já em uso — só rótulos. */
const TIPOS_AUSENCIA = [
  { k: "ferias",  rotulo: "Férias" },
  { k: "medica",  rotulo: "Licença médica" },
  { k: "licenca", rotulo: "Outras licenças" },
  { k: "banco",   rotulo: "Banco de horas" },
  { k: "abono",   rotulo: "Abono" },
  { k: "outro",   rotulo: "Outro afastamento" }
];

/* Preencha os servidores e a chefia de cada unidade.
   "chefia": null exibe campo livre para digitar o nome;
   informado aqui, o nome já vem preenchido na identificação. */
const UNIDADES = {
  "SEACE":  { chefia: null, servidores: [] },
  "SEARI":  { chefia: null, servidores: [] },
  "SECAQ":  { chefia: null, servidores: [] },
  "SEDIN":  { chefia: null, servidores: [] },
  "SENOV":  { chefia: null, servidores: [] },
  "SEORE":  { chefia: "Exemplo Chefia SEORE", servidores: ["Christiane Rocha", "Silvia Regina"] },
  "SEPERI": { chefia: null, servidores: [] },
  "SEREN":  { chefia: null, servidores: [] }
};

/* Nome da chefia geral (opcional; null exibe campo livre). Os
   lançamentos da chefia geral ficam na pasta GERAL da rede. */
const CHEFIA_GERAL = "Exemplo Chefia Geral";  // substitua pelo nome real

const PROCESSOS = [
  {
    nome: "Desenvolver acervo bibliográfico impresso e digital",
    atividades: [
      { t: "Acompanhar e assegurar o funcionamento de recursos informacionais, bases de dados e plataformas digitais da COBIB.", c: ["a"] },
      { t: "Atualizar e manter conteúdos, estruturas e recursos dos portais, páginas e ambientes digitais sob responsabilidade da COBIB.", c: ["b", "m", "a"] },
      { t: "Avaliar material informacional do acervo para permanência, substituição, atualização ou descarte.", c: ["a"] },
      { t: "Avaliar material informacional recebido por doação.", c: ["m", "a"] },
      { t: "Captar, preparar e disponibilizar conteúdos informacionais em plataformas e ambientes digitais de acesso à informação.", c: ["m", "a"] },
      { t: "Coordenar e acompanhar a disponibilização de conteúdos e coleções em ambientes digitais e na Biblioteca Digital.", c: ["a"] },
      { t: "Elaborar estudos, levantamentos e pesquisas para subsidiar o desenvolvimento de coleções e a atualização de políticas e critérios de seleção.", c: ["a"] },
      { t: "Elaborar lista para seleção e encomenda de material informacional.", c: ["m"] },
      { t: "Gerenciar autorizações de uso, cessão de direitos autorais e demais instrumentos relacionados à disponibilização de conteúdos digitais.", c: ["b", "m"] },
      { t: "Gerenciar contratos, assinaturas, acessos e recursos orçamentários relacionados aos recursos informacionais da COBIB.", c: ["a"] },
      { t: "Identificar, selecionar e encaminhar conteúdos raros, especiais e institucionais para digitalização e disponibilização digital.", c: ["m"] },
      { t: "Instruir e acompanhar processos de aquisição, contratação e assinatura de material informacional, bases de dados e serviços especializados.", c: ["a"] },
      { t: "Planejar e executar ações de desenvolvimento e atualização de coleções bibliográficas e recursos informacionais.", c: ["a"] },
      { t: "Planejar e operacionalizar ações relacionadas à seleção, avaliação, desbastamento e descarte de material informacional.", c: ["a"] },
      { t: "Prospectar, selecionar e avaliar material informacional para composição e atualização do acervo físico e digital.", c: ["m", "a"] },
      { t: "Realizar atividades relacionadas à aquisição, incorporação e controle de materiais informacionais físicos e digitais.", c: ["m"] },
      { t: "Realizar intercâmbio de material informacional com outras instituições.", c: ["m"] },
      { t: "Receber, conferir e registrar materiais informacionais adquiridos, recebidos em doação ou disponibilizados por assinatura.", c: ["b"] }
    ]
  },
  {
    nome: "Desenvolver e gerir produtos de informação",
    atividades: [
      { t: "Desenvolver ações de curadoria, organização e disseminação de conteúdos em páginas, comunidades e ambientes digitais da COBIB.", c: ["m", "a"] },
      { t: "Elaborar boletins, sumários, bibliografias, alertas e demais produtos de divulgação e promoção do acervo e dos recursos informacionais.", c: ["m", "a"] },
      { t: "Elaborar e revisar taxonomias, estruturas de navegação e instrumentos de organização da informação para ambientes digitais e produtos informacionais.", c: ["b", "m", "a"] },
      { t: "Elaborar, revisar e normalizar referências bibliográficas e conteúdos informacionais conforme normas técnicas aplicáveis.", c: ["m", "a"] },
      { t: "Planejar pautas e ações de divulgação relacionadas ao acervo, às atividades legislativas e aos produtos informacionais da Biblioteca.", c: ["b", "m"] },
      { t: "Planejar, organizar, divulgar e executar eventos, ações culturais e atividades de promoção da informação e da leitura.", c: ["m", "a"] },
      { t: "Produzir conteúdos textuais, editoriais e analíticos para produtos informacionais, publicações e canais de disseminação da informação.", c: ["b", "m", "a"] },
      { t: "Produzir e divulgar conteúdos para redes sociais, páginas institucionais e canais digitais da COBIB.", c: ["b", "m", "a"] },
      { t: "Produzir, atualizar e gerenciar conteúdos informacionais em comunidades, páginas e ambientes digitais da COBIB.", c: ["b", "m", "a"] },
      { t: "Realizar a gestão e divulgação de eventos institucionais promovidos ou apoiados pela COBIB em ambientes físicos e digitais.", c: ["b", "m", "a"] },
      { t: "Realizar estudos, entrevistas e levantamentos temáticos para definição de conteúdos, critérios de organização e produtos de informação.", c: ["b", "m", "a"] },
      { t: "Realizar levantamento, refinamento e tratamento de referências bibliográficas em bases de dados e fontes de informação especializadas.", c: ["m", "a"] },
      { t: "Realizar pesquisas bibliográficas e levantamento de conteúdos especializados para subsidiar produtos informacionais e demandas institucionais.", c: ["m", "a"] },
      { t: "Realizar prospecção, seleção e curadoria de documentos raros e especiais para exposições, elaborar projetos curatoriais, roteiros e conteúdos expositivos.", c: ["a"] },
      { t: "Selecionar, analisar e disponibilizar conteúdos informacionais provenientes de jornais, revistas e outras fontes de informação para inserção em produtos e sistemas institucionais.", c: ["b", "m"] },
      { t: "Selecionar, tratar e disponibilizar conteúdos jornalísticos, bibliográficos e informacionais em produtos e canais institucionais.", c: ["b", "m", "a"] }
    ]
  },
  {
    nome: "Gerir acervo bibliográfico impresso e digital",
    atividades: [
      { t: "Acompanhar e fiscalizar contratos relacionados à manutenção de sistemas, bases de dados e serviços especializados.", c: ["m"] },
      { t: "Coordenar e acompanhar serviços relacionados à digitalização de conteúdos solicitados pelos usuários, observadas as normas aplicáveis.", c: ["b"] },
      { t: "Desenvolver ações de mediação, orientação e difusão cultural relacionadas ao acervo e à memória institucional da Biblioteca.", c: ["b", "m", "a"] },
      { t: "Executar atividades de cadastro, atualização e regularização de usuários no sistema de gerenciamento da Biblioteca.", c: ["b"] },
      { t: "Gerenciar e acompanhar o controle de empréstimos, devoluções, reservas, renovações e empréstimos via presencial e remoto.", c: ["m"] },
      { t: "Gerenciar e acompanhar o funcionamento de bases de dados, sistemas e recursos digitais de acesso à informação.", c: ["m", "a"] },
      { t: "Identificar, acompanhar e adotar providências relacionadas à indisponibilidade de serviços, falhas de acesso e inconsistências em recursos informacionais digitais.", c: ["m", "a"] },
      { t: "Identificar, selecionar e encaminhar materiais informacionais para higienização, encadernação, restauração, desinfecção e demais ações de preservação.", c: ["b"] },
      { t: "Monitorar, registrar e acompanhar ocorrências relacionadas ao uso do salão de leitura, circulação e conservação do acervo bibliográfico.", c: ["m"] },
      { t: "Organizar, controlar e preservar o acervo bibliográfico físico e digital.", c: ["m"] },
      { t: "Planejar e realizar visitas guiadas e ações de apresentação institucional e histórica do acervo bibliográfico, raro e especial da Biblioteca.", c: ["m", "a"] },
      { t: "Planejar, executar e supervisionar inventários físicos do acervo bibliográfico, incluindo obras raras e especiais.", c: ["a"] },
      { t: "Realizar a prospecção de documentos raros no acervo geral, com vistas à salvaguarda e difusão do acervo.", c: ["m"] },
      { t: "Realizar atendimento a consultas relacionadas ao acervo bibliográfico, incluindo obras raras, especiais e coleções históricas.", c: ["a"] },
      { t: "Realizar atendimento presencial e remoto aos usuários, incluindo orientação quanto ao uso do acervo, dos espaços e dos recursos informacionais da Biblioteca.", c: ["b", "m"] },
      { t: "Realizar atividades de conferência, atualização e correção de registros e itens em sistemas de gerenciamento de biblioteca.", c: ["m"] },
      { t: "Receber, conferir, registrar e disponibilizar fascículos de jornais, periódicos e demais materiais incorporados ao acervo bibliográfico.", c: ["b"] },
      { t: "Revisar, remanejar, ordenar e sinalizar materiais e coleções do acervo físico da Biblioteca.", c: ["m"] },
      { t: "Supervisionar e manter a organização, conservação e integridade do acervo bibliográfico da COBIB.", c: ["m", "a"] },
      { t: "Supervisionar o funcionamento, a atualização e o fluxo de processamento de conteúdos na Biblioteca Digital.", c: ["m", "a"] }
    ]
  },
  {
    nome: "Gerir o planejamento, projetos, processos e pessoas da COBIB",
    atividades: [
      { t: "Analisar informações gerenciais, indicadores e dados de desempenho para subsidiar o planejamento e a tomada de decisão.", c: ["a"] },
      { t: "Coordenar e acompanhar ações relacionadas à organização, integração e alinhamento das equipes e atividades da COBIB.", c: ["m", "a"] },
      { t: "Elaborar, revisar e apoiar a implementação de políticas, normas, diretrizes e procedimentos relacionados às atividades da COBIB em relação às políticas institucionais da CD.", c: ["m", "a"] },
      { t: "Executar atividades de suporte técnico e administrativo relacionadas ao funcionamento da COBIB.", c: ["b", "m"] },
      { t: "Instruir, acompanhar e gerenciar processos administrativos e fluxos processuais em sistemas institucionais.", c: ["b", "m"] },
      { t: "Planejar, acompanhar e executar atividades relacionadas à gestão orçamentária, aquisições e contratações da COBIB.", c: ["a"] },
      { t: "Planejar, coordenar, supervisionar, implementar e manter atualizados os processos de trabalho, projetos, ações estratégicas e instrumentos de gestão da COBIB.", c: ["m"] },
      { t: "Promover o intercâmbio de informações, experiências e ações de cooperação com instituições congêneres e redes colaborativas.", c: ["m", "a"] },
      { t: "Propor, coordenar e acompanhar ações de inovação, melhoria contínua e modernização de produtos, serviços e processos da COBIB.", c: ["m", "a"] }
    ]
  },
  {
    nome: "Tratar conteúdo informacional impresso e digital",
    atividades: [
      { t: "Atualizar e manter vocabulários controlados, descritores, terminologias e instrumentos de organização e recuperação da informação.", c: ["b"] },
      { t: "Captar, analisar, descrever e preparar conteúdos digitais para disponibilização em ambientes e plataformas de acesso à informação.", c: ["b", "m", "a"] },
      { t: "Elaborar fichas catalográficas e demais instrumentos de representação descritiva da informação.", c: ["a"] },
      { t: "Preparar, identificar e organizar materiais informacionais para circulação, armazenamento e disponibilização no acervo.", c: ["b"] },
      { t: "Produzir, revisar e atualizar registros bibliográficos, metadados e instrumentos de representação da informação em sistemas e repositórios institucionais.", c: ["b", "m", "a"] },
      { t: "Realizar a inclusão, revisão e controle de conteúdos informacionais na Biblioteca Digital.", c: ["m", "a"] },
      { t: "Realizar o processamento técnico de material informacional impresso, digital, raro e especial, incluindo catalogação, classificação e indexação, conforme padrões institucionais, nacionais e internacionais.", c: ["m", "a"] },
      { t: "Revisar e validar padrões de organização, representação e tratamento da informação adotados pela COBIB.", c: ["m"] },
      { t: "Supervisionar e revisar atividades de processamento técnico e indexação de conteúdos informacionais.", c: ["m", "a"] }
    ]
  }
];

/* =========================================================
   SENHAS (opcional) — hash SHA-256 de (nome + "|" + senha).
   Gere o código com o utilitário gerar-senha.html e cole aqui.
   Pessoas sem entrada neste mapa:
   - entram sem senha se EXIGIR_SENHA = false (fase de transição);
   - são bloqueadas se EXIGIR_SENHA = true.
   Atenção: isto é uma barreira contra uso casual de identidade
   alheia. O controle de acesso real deve vir das permissões
   NTFS/AD da pasta da rede (ver LEIA-ME).
   ========================================================= */
const EXIGIR_SENHA = false;
const SENHAS = {
  // "Christiane Rocha": "cole-aqui-o-hash-gerado",
};

/* Caminho da pasta central exibido como orientação na etapa 1
   (o navegador não permite abrir o caminho automaticamente;
   cada pessoa o seleciona uma vez e a escolha fica memorizada). */
const PASTA_REDE = "\\\\COBIB\\AmbienteTrabalho\\unidadeCentral";
