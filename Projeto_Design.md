# Programa de Resultados — COBIB
## Relatório Técnico do Projeto
### Versão 1.10 · Aplicação Web Progressiva (PWA) *client-side*

> Documento de referência para manutenção e evolução do sistema.
> Destinado a desenvolvedores humanos e a modelos de IA.
>
> Este relatório substitui o *Relatório Técnico v8*, que descrevia o sistema quando
> ele ainda se chamava **Registro de Atividades**. A estrutura das seções foi preservada para facilitar a
> comparação; o conteúdo foi revisto de ponta a ponta e acrescido de tudo que
> entrou entre a v9 e a versão atual.
>
> O relatório descreve **a versão em uso** e acompanha o `code/`: não há uma cópia
> por versão, e por isso o nome do arquivo não traz número — pela regra do
> repositório, versão é *tag*, não nome de arquivo. O que estava escrito em cada
> versão publicada se recupera pela tag correspondente (`git show v1.0:Projeto_Design_v1.0.md`
> para as anteriores à renomeação).

---

## Sumário

1. [Visão geral do projeto](#1-visão-geral-do-projeto)
2. [Arquitetura](#2-arquitetura)
3. [Estrutura de arquivos do aplicativo](#3-estrutura-de-arquivos-do-aplicativo)
4. [Modelo de dados (esquemas JSON)](#4-modelo-de-dados-esquemas-json)
5. [Perfis, permissões e cadeia de aprovação](#5-perfis-permissões-e-cadeia-de-aprovação)
6. [Interface: telas, rail e abas](#6-interface-telas-rail-e-abas)
7. [Carga horária, meta alcançada e ausências](#7-carga-horária-meta-alcançada-e-ausências)
8. [Visão gerencial: indicadores e gráficos](#8-visão-gerencial-indicadores-e-gráficos)
9. [Selo de instalação e controle da pasta oficial](#9-selo-de-instalação-e-controle-da-pasta-oficial)
10. [Modelo de segurança e suas fronteiras](#10-modelo-de-segurança-e-suas-fronteiras)
11. [PWA, execução e implantação](#11-pwa-execução-e-implantação)
12. [Limitações conhecidas](#12-limitações-conhecidas)
13. [Guia prático de modificação](#13-guia-prático-de-modificação)
14. [Roteiro de evolução sugerido](#14-roteiro-de-evolução-sugerido)
15. [Glossário](#15-glossário)
- [Anexo — O que é uma Progressive Web App](#anexo--o-que-é-uma-progressive-web-app)

---

## 1. Visão geral do projeto

**Objetivo.** O sistema cria um formulário web para registro diário da produção de
trabalho da COBIB (Coordenação de Biblioteca). Cada pessoa registra as atividades
que executou, vinculadas a um processo de trabalho e a uma atividade com pontuação
definida por complexidade (baixa, média, alta). As chefias aprovam os lançamentos
em uma cadeia hierárquica, e um administrador gerencia a configuração do sistema.
A partir da v11 o sistema também mede o **percentual da meta alcançada**, calculado
sobre a carga horária diária de cada pessoa, e registra **ausências por período**.

**Restrição fundamental de arquitetura.** O projeto foi concebido para funcionar
sem servidor de aplicação e sem banco de dados remoto. Todo o código executa no
navegador (Chrome ou Edge) e os dados são persistidos em uma pasta de rede
compartilhada acessada diretamente pelo navegador. Essa decisão condiciona todo o
restante do desenho e deve ser respeitada em melhorias futuras, salvo decisão
explícita de migrar para uma arquitetura com *backend* (ver seção 14).

Na prática, isso significa: **nenhum servidor, nenhum banco, nenhum npm, nenhuma
etapa de build, nenhum CDN**. O aplicativo tem de rodar abrindo-se `index.html`
a partir de uma pasta. Qualquer proposta que acrescente servidor, gerenciador de
pacotes ou dependência de rede está fora de escopo e deve ser sinalizada como tal
antes de ser implementada.

**Tecnologias.** HTML5, CSS3 e JavaScript puro (sem framework, sem etapa de build,
sem dependências externas em tempo de execução). Persistência via File System
Access API (gravação de arquivos JSON na pasta de rede) e IndexedDB / localStorage
(estado local do navegador). Gráficos com ECharts — **embarcado na pasta do
aplicativo, nunca buscado em CDN**. Empacotado como PWA, com manifesto e service
worker *cache-first* para instalação e uso offline.

### 1.1. Público-alvo deste documento

Este relatório foi escrito para permitir que qualquer pessoa desenvolvedora — ou
qualquer modelo de IA — retome o projeto sem conhecimento prévio e implemente
melhorias com segurança. Ele descreve a arquitetura, o modelo de dados, o fluxo de
cada perfil, as decisões de projeto e suas justificativas, as limitações conhecidas
e um roteiro de evolução. Presume-se familiaridade com JavaScript e com conceitos
web, mas não com este código.

Documento complementar obrigatório: **`code/LEIA-ME.txt`**. Ele não é um registro
de mudanças — é o texto que argumenta *por que* cada decisão foi tomada, em prosa
simples, admitindo as limitações. Qualquer alteração de comportamento precisa de
uma seção correspondente escrita naquela voz.

### 1.2. Histórico de versões

O projeto evoluiu de forma incremental. Conhecer a trajetória ajuda a entender por
que certas estruturas existem. As versões 1 a 14 foram betas, a partir da 1.0 o histórico
vive neste repositório.

| Versão | Marco introduzido |
|---|---|

| **1.0** | Saída do beta. Nenhuma mudança de tela, regra ou arquivo em relação à v14 — o que mudou foi o estado do programa (deixou de ser experimento) e a forma de guardar versões (ver 1.3). |
| **1.1** | Janela **"Sobre o programa"**, alcançável pelo rail mesmo antes da identificação; e a versão do aplicativo passa a ser escrita em **um lugar só** (`versao.js`), de onde saem a etiqueta do rail, a janela e a chave do cache do service worker. |
| **1.2** | Tela de **Ajuda** embutida, com quatro capturas: objetivo do programa, papéis, organização da tela, como lançar, como buscar, o que a meta mede e como a chefia aprova. Alcançável antes da identificação, como o "Sobre". |
| **1.3** | A seção **Ausências** fica oculta enquanto a gestão discute o assunto, ligável pelo administrador no `config.json` (`mostrarAusencias`). Nada foi removido: código, dados e o desconto de ausências no cálculo da meta continuam como estavam. |
| **1.4** | O campo de busca de atividade ganha **destaque por superfície** (painel recuado, rótulo visível, texto de apoio dentro dele) e passa a vir **antes** dos atalhos de "Suas mais registradas". |
| **1.5** | Dado interno sai do repositório: `catalogo.js` vira semente sem pessoas, exemplos da documentação passam a usar nomes inventados, o PDF das betas sai da árvore e um `.gitignore` barra `config.json` e pastas de teste. |
| **1.6** | O `<link rel="manifest">` sai do `<head>` e passa a ser **criado por código**, sob a mesma condição de protocolo que já guardava o registro do service worker. Sob `file://` — o duplo clique — o Chrome tratava cada arquivo como origem única e negava a busca do manifesto, enchendo o console de erros que não quebravam nada. |
| **1.7** | Duas respostas ao primeiro teste de uso com servidores. A **data do lançamento não passa do dia corrente** (o calendário cinza os dias futuros, e o teto é recalculado a cada foco no campo). E o cartão "Qual atividade?" ganha **contraste e ênfase**: `--linha-campo` separa contorno de controle de fio de estrutura em todas as telas, o **filtro por processo fica sempre visível e antes da busca**, e os atalhos "Suas mais registradas" ganham régua e rótulo de peso. Nenhum texto de tela mudou. |

| **1.8** | A janela "Sobre o programa" passa a exibir o **selo do catálogo** (`CATALOGO_ATUALIZADO`), a data da última edição do `catalogo.js`. O navegador decide sozinho quando reler esse arquivo, e um catálogo velho é indistinguível de um correto na tela; o selo não descongela o arquivo, apenas torna a defasagem verificável. Catálogo anterior à 1.8 não tem a constante, e a linha é omitida. |
| **1.9** | `config.json` **ilegível deixa de ser confundido com pasta nova**. `lerConfig` passa a distinguir arquivo ausente de arquivo quebrado; a tela mostra o motivo e **recusa a entrada — a do Administrador inclusive — enquanto o arquivo estiver ilegível**, porque oficializar por cima gravava o catálogo vazio da semente sobre unidades, chefias, servidores e senhas. A tranca fica na tela e dentro da própria oficialização, e a confirmação passa a dizer que grava o `config.json`. |
| **1.10** | O **`catalogo.js` passa a ser servido rede-first** pelo `sw.js`. Servido por HTTP(S), o service worker o entregava do cache como se fosse parte do programa, e uma edição no catálogo não chegava a quem já tinha aberto o aplicativo — em silêncio, porque catálogo velho é idêntico a catálogo certo na tela. Agora tenta a rede, guarda o que voltar e cai no cache quando a rede falta; um prazo de 2,5 s impede que a única requisição que toca a rede trave a abertura. Sob `file://` nada muda: ali não há service worker. |

### 1.3. Versionamento por *tags* (novidade da 1.0)

Até a v14, cada versão nova era uma **cópia inteira** da pasta anterior
(`versionBeta/v1`, `v2`, … `v14`). Isso fazia sentido enquanto tudo era tentativa:
dava para abrir duas versões lado a lado e comparar na tela, sem ferramenta
nenhuma. Mas o custo cresceu — catorze cópias do mesmo aplicativo, incluindo
catorze vezes o `echarts.min.js`, e nenhuma delas dizendo o que a diferenciava da
vizinha.

Agora existe **uma pasta só**, `code/`, com o aplicativo em uso. O histórico passou
para o repositório: cada mudança é um *commit*, e cada versão publicada é uma
**tag** (`v1.0`, `v1.1`, …).

Perda assumida: não dá mais para abrir duas versões ao mesmo tempo copiando
pastas — é preciso um `git checkout` da tag desejada. Em compensação, a pergunta
que a pasta nunca respondia ("o que mudou da v12 para a v13, e por quê?") passou a
estar escrita no próprio histórico.

**Publicar uma versão são duas coisas que precisam concordar entre si:**

1. `code/versao.js` → o número, a etiqueta exibida e a data de atualização;
2. a *tag* do repositório (`git tag -a v1.5`).

A versão do `versao.js` acompanha a tag: a tag `v1.5` corresponde a `"1.5"` e à
chave de cache `"ra-1.5"`. Até a 1.0 eram **três** coisas — a etiqueta do
`index.html` e a `VERSAO` do `sw.js` guardavam, cada uma, a sua cópia do número.
A v1.1 juntou as duas num arquivo só (ver 3.6): a etiqueta do rail, a janela
"Sobre o programa" e a chave do cache passaram a derivar dele.

> **Não crie** `code/v2/`, `versionBeta/` ou cópias datadas de arquivos. A mudança
> é feita no lugar; o histórico guarda o passado.

---

## 2. Arquitetura

O sistema é composto por arquivos estáticos servidos ao navegador. Não há
processamento no lado do servidor: um servidor HTTP (ou o próprio duplo clique no
arquivo) apenas entrega os arquivos, e toda a lógica — identificação, leitura e
gravação de dados, aprovação, administração, cálculo de meta, gráficos — executa no
cliente. A comunicação de dados entre pessoas acontece exclusivamente por meio de
arquivos JSON gravados em uma pasta de rede comum, que cada navegador lê e escreve
diretamente.

### 2.1. Diagrama lógico

```
Navegador (Chrome/Edge) da pessoa A ─┐
Navegador (Chrome/Edge) da pessoa B ─┼─ ▶  Pasta de rede compartilhada
Navegador (Chrome/Edge) do adm      ─┘      \\COBIB\AmbienteTrabalho\unidadeCentral
                                               │
 Cada navegador:                               ├─ config.json      (configuração central)
 • roda index.html + catalogo.js + rede.js     ├─ SEORE/
   + echarts.min.js                            │   ├─ lancamentos/<pessoa>.json
 • lê/grava arquivos JSON via                  │   └─ aprovacoes.json
   File System Access API                      ├─ SEACE/ ...       (demais unidades)
 • guarda handle da pasta no IndexedDB         └─ GERAL/
 • guarda identidade e preferências                ├─ lancamentos/<chefia-geral>.json
   de tela no localStorage                         └─ aprovacoes.json
```

As subpastas são criadas automaticamente pelo aplicativo no primeiro uso de cada
unidade. SEORE, SEACE etc. são exemplos de nomes de unidades; o conjunto vem da
configuração central e pode ser alterado pelo Administrador.

### 2.2. Princípio "um arquivo, um único escritor"

A regra central que garante integridade sem banco de dados é: **cada arquivo tem um
único autor que o grava**. Nenhum arquivo é escrito concorrentemente por duas
pessoas. Assim, mesmo com muitos usuários simultâneos em máquinas diferentes, não
há condição de corrida destrutiva — apenas leituras cruzadas, que são seguras.
Concretamente:

- `<unidade>/lancamentos/<pessoa>.json` é gravado somente pelo próprio servidor ou
  chefia dono do arquivo;
- `<unidade>/aprovacoes.json` é gravado somente pela chefia daquela unidade;
- `GERAL/aprovacoes.json` é gravado somente pela chefia geral;
- `config.json` é gravado somente pelo administrador.

**Como a v12 preservou o princípio ao ampliar a alçada.** A partir da v12 a chefia
geral pode aprovar *qualquer* lançamento, inclusive de servidores. A tentação seria
gravar essa aprovação no `aprovacoes.json` da unidade — e isso quebraria tudo: dois
papéis escrevendo no mesmo arquivo, aprovações simultâneas se sobrescrevendo, e as
permissões NTFS recomendadas (chefia geral com escrita apenas em `GERAL/`)
impedindo a gravação. A solução foi manter cada papel gravando só no seu arquivo e
**fazer a leitura olhar os dois lugares**: um lançamento de servidor está aprovado
se constar no arquivo da unidade **ou** no da chefia geral (função `aprovacaoDe`).
Constando nos dois, prevalece o da unidade na exibição, por ser a via ordinária.

> **Regra derivada, válida para qualquer melhoria futura:** prefira *ler* de dois
> lugares a *escrever* em um lugar compartilhado. Se dois perfis precisarem gravar
> no mesmo arquivo, o desenho está errado.

**Consequência: ninguém desfaz a aprovação do outro.** A chefia da unidade não
consegue desmarcar o que a chefia geral aprovou, e vice-versa. Ao tentar, a tela
explica em vez de fingir que funcionou — sem isso a marca voltaria sozinha na
renderização seguinte e pareceria defeito. O administrador continua podendo excluir
o lançamento inteiro (a aprovação órfã vai junto).

**Exceção controlada:** o administrador pode gravar em arquivos de lançamento de
terceiros ao excluir um registro (correção de erro). É uma operação pontual e
humana, não concorrente. Ainda assim é o único ponto onde a regra é relaxada, e
mesmo ele passa pelo ponto único de escrita descrito em 4.2.

### 2.3. Onde cada tipo de estado vive

| Estado | Local | Escopo |
|---|---|---|
| Lançamentos, ausências e carga horária | `<unidade>/lancamentos/<pessoa>.json` | Compartilhado (todos) |
| Aprovações | `<unidade>/aprovacoes.json` e `GERAL/aprovacoes.json` | Compartilhado (todos) |
| Configuração (pessoas, senhas, selo) | `config.json` na raiz da pasta | Compartilhado (todos) |
| Processos e atividades | `catalogo.js` (arquivo do app) | Semente / estático |
| Handle da pasta escolhida | IndexedDB (base `ra-rede`, chave `raiz`) | Local ao navegador |
| Identidade confirmada | `localStorage` → `ra.identificacao.v5` | Local ao navegador |
| Selo aceito neste PC | `localStorage` → `ra.instalacao.v1` | Local ao navegador |
| Aba escolhida no painel | `localStorage` → `ra.aba.v1` | Local ao navegador |

**Sobre as chaves versionadas.** `ra.identificacao.v5` substituiu a `v4` quando a
identidade memorizada passou a carregar a carga horária: as chaves antigas são
simplesmente descartadas, para nunca restaurar uma identidade sem carga. A chave
`ra.secoes.v1` (estado do acordeão da v12/v13) deixou de ser usada na v14, quando o
acordeão virou abas, e foi substituída por `ra.aba.v1`.

> **Nunca renomeie uma chave persistida** — nem de `localStorage`, nem de papel, nem
> os `k` de `TIPOS_AUSENCIA`. Crie uma chave nova com sufixo de versão.

---

## 3. Estrutura de arquivos do aplicativo

```
code/                    o aplicativo — uma cópia só, sempre a versão atual
  index.html             interface, lógica e CSS embutido
  versao.js              o único lugar onde a versão é escrita
  catalogo.js            catálogo editável: unidades, pessoas, processos,
                         atividades, pontos, tipos de ausência, metas diárias
  rede.js                acesso à pasta de rede: handle, permissões, JSON
  sw.js                  service worker; monta a chave do cache a partir
                         do versao.js
  manifest.webmanifest   metadados do PWA
  gerar-senha.html       ferramenta avulsa: gera o hash SHA-256 de uma senha
  echarts.min.js         biblioteca de gráficos (embarcada, não baixada)
  icons/                 icon-192.png, icon-512.png
  ajuda/                 as quatro capturas da tela de Ajuda (WebP)
  LEIA-ME.txt            a documentação de verdade: o que mudou e POR QUÊ
Projeto_Design.md             este documento
.gitignore                    barra config.json, pastas de teste e *.local.js
README.md                     apresentação curta do repositório
CLAUDE.md                     instruções para agentes de IA que editem o repo
```

| Arquivo | Linhas | Responsabilidade |
|---|---:|---|
| `index.html` | ~2.900 | Interface (HTML + CSS) e toda a lógica da aplicação em um `<script>`. É o coração do sistema. |
| `versao.js` | ~25 | Número da versão, etiqueta exibida, data da última atualização e endereço do repositório. Lido pelo `index.html` e pelo `sw.js`. |
| `ajuda/*.webp` | 189 KB | Capturas usadas na tela de Ajuda. WebP em vez de PNG (671 KB) — o aplicativo é Chrome/Edge por decisão de projeto. |
| `catalogo.js` | ~183 | Dados-semente: processos, atividades, pontuação, metas diárias, tipos de ausência, unidades, chefias, servidores, senhas iniciais e caminho da pasta. Carrega também `CATALOGO_ATUALIZADO`, a data da própria edição. |
| `rede.js` | ~205 | Camada de acesso à pasta de rede: IndexedDB para o handle, permissões, leitura/gravação de JSON, leitura estrita antes de gravar. |
| `echarts.min.js` | 521 KB | Build próprio do ECharts, só com o que o aplicativo usa. |
| `gerar-senha.html` | ~63 | Utilitário isolado para gerar o *hash* SHA-256 de uma senha, a ser colado em `SENHAS` no `catalogo.js` (ou usado pelo painel do adm). |
| `sw.js` | ~37 | Service worker: cache dos arquivos para funcionamento offline. |
| `manifest.webmanifest` | 29 | Metadados do PWA (nome, ícones, cores, modo *standalone*). |
| `LEIA-ME.txt` | ~920 | Documentação de decisões e manual operacional. |

O crescimento de `index.html` (de ~971 linhas na v8 para ~2.838 na 1.0) corresponde
às funcionalidades das versões 9 a 14: busca de atividades, gráficos, meta,
ausências, recibo, abas e o redesenho da navegação. A opção por manter tudo num
arquivo é deliberada: sem etapa de build, dividir em módulos exigiria `type=module`
e servidor HTTP, o que quebraria o requisito de abrir o `index.html` por duplo
clique.

### 3.1. `catalogo.js` — dados-semente e configuração inicial

Define constantes globais lidas pelo restante do app. A partir da v6, os campos de
pessoas e senhas funcionam apenas como **semente**: na primeira oficialização são
copiados para o `config.json`, que passa a ser a fonte de verdade. O `catalogo.js`
permanece autoritativo para `PROCESSOS`/`ATIVIDADES` (que mudam raramente), para as
tabelas de pontuação e meta, para os tipos de ausência e para `PASTA_REDE`.

```js
/* NOVIDADE v1.8 — data desta edição do catálogo, exibida em "Sobre o
   programa". Manual, como a do versao.js. Serve para responder QUAL
   catálogo o navegador está usando: um catálogo velho é idêntico a um
   certo na tela, e sem o selo não há como distingui-los. */
const CATALOGO_ATUALIZADO = '20.08.2026';

const PONTOS = { b: 5, m: 10, a: 15 };                    // baixa, média, alta
const ROTULO_COMPLEXIDADE = { b: 'Baixa', m: 'Média', a: 'Alta' };

/* NOVIDADE v11 — meta de pontos por DIA TRABALHADO, conforme a jornada */
const META_DIARIA = { 8: 15, 6: 11 };

/* NOVIDADE v11 — tipos de ausência; "k" é o que fica gravado no arquivo
   da pessoa: NÃO troque chaves em uso, só rótulos */
const TIPOS_AUSENCIA = [
  { k: 'ferias',  rotulo: 'Férias' },
  { k: 'medica',  rotulo: 'Licença médica' },
  { k: 'licenca', rotulo: 'Outras licenças' },
  { k: 'banco',   rotulo: 'Banco de horas' },
  { k: 'abono',   rotulo: 'Abono' },
  { k: 'outro',   rotulo: 'Outro afastamento' }
];

const PROCESSOS = [                                // 5 processos, 72 atividades
  { nome: '...', atividades: [
      { t: 'texto da atividade', c: ['b','m','a'] }  // c = complexidades válidas
  ] }, ...
];

const UNIDADES = {                                 // 8 unidades, SEM pessoas
  'SEORE': { chefia: null, servidores: [] }, ...   //  (ver 10.5)
};
const CHEFIA_GERAL = null;
const SENHAS = {};                                 // vazio no repositório
const EXIGIR_SENHA = false;
const PASTA_REDE = '\\\\COBIB\\AmbienteTrabalho\\unidadeCentral';
```

**Modelo de complexidade por atividade:** o campo `c` lista quais níveis são válidos
para aquela atividade. O formulário habilita apenas os botões correspondentes e,
quando há um único nível, pré-seleciona-o. Os botões desabilitados continuam
legíveis de propósito — eles *informam* quais complexidades a atividade admite, não
são apenas controles indisponíveis.

Há 5 processos e 72 atividades cadastrados, comuns às 8 unidades (SEACE, SEARI,
SECAQ, SEDIN, SENOV, SEORE, SEBID, SEREN).

> Os nomes `"Exemplo Chefia SEORE"` e `"Exemplo Chefia Geral"` no arquivo
> distribuído são demonstrativos e precisam ser substituídos na implantação.

### 3.2. `rede.js` — camada de persistência

Isola toda a interação com a File System Access API e o IndexedDB.

| Função | Papel |
|---|---|
| `salvarHandleRaiz` / `obterHandleRaiz` | Guardam e recuperam o handle da pasta escolhida, no IndexedDB (base `ra-rede`), para persistir entre sessões. |
| `garantirPermissao(handle, modo, pedir)` | Verifica/solicita permissão de leitura ou escrita sobre um handle. |
| `slug(nome)` | Converte um nome de pessoa em nome de arquivo seguro (sem acentos/símbolos). |
| `lerJSONDe` / `gravarJSONEm` | Leitura e gravação genéricas de um JSON dentro de um diretório. |
| `lerMeuArquivo` / `gravarMeuArquivo` | Arquivo da pessoa: `<unidade>/lancamentos/<slug>.json` (registros + carga + ausências). |
| **`lerArquivoParaGravar`** | **(v11)** Leitura *estrita*, obrigatória antes de qualquer gravação — ver abaixo. |
| **`lerCargaHoraria`** | **(v11)** Devolve 8, 6 ou `null` lendo o cabeçalho do arquivo da pessoa. |
| `lerLancamentosDaUnidade` | Concatena os lançamentos de todos os arquivos de uma unidade. |
| **`lerAusenciasDaUnidade`** | **(v11)** Idem para as ausências. |
| `lerAprovacoes` / `gravarAprovacoes` | Mapa `{idLancamento: {por, em}}` de uma unidade (ou `GERAL`). |
| `lerConfig` / `gravarConfig` | Configuração central `config.json` na raiz. Desde a 1.9, `lerConfig` devolve `{ estado, dados, motivo }` com `estado` em `"ausente"` / `"ilegivel"` / `"ok"`: arquivo inexistente e arquivo quebrado precisam ser respostas diferentes, porque oficializar por cima de um arquivo ilegível gravava a semente vazia sobre a configuração real. |

**Detalhe de robustez (leitura em lote).** A leitura de lançamentos e ausências
ignora silenciosamente arquivos malformados (`try/catch` por arquivo), para que um
JSON corrompido de uma pessoa não derrube a visão da chefia. Gravações sempre
reescrevem o arquivo inteiro (os volumes são de poucos KB), o que simplifica o
modelo e evita edições parciais.

**Detalhe crítico (leitura antes de gravar).** `lerMeuArquivo()` devolve `null`
tanto para "o arquivo não existe" quanto para "o arquivo existe mas está
ilegível" — e regravar em cima do segundo caso apagaria o histórico inteiro da
pessoa. `lerArquivoParaGravar()` separa os dois casos:

```
não existe (ou está vazio)  ->  null, pode criar à vontade
existe e não decifra        ->  LANÇA erro, NÃO grave por cima
```

O erro carrega a marca `.arquivoIlegivel`, para que a tela mostre a mensagem como
está, sem o prefixo "não foi possível gravar": não houve falha de gravação, houve
**recusa deliberada** de gravar. Um JSON válido mas sem a lista `registros` também é
recusado — estrutura inesperada é motivo para parar, não para presumir vazio.

Sem essa separação, um arquivo corrompido (uma gravação interrompida, por exemplo)
seria tratado como "pessoa nova" e sobrescrito com uma lista vazia — e isso
aconteceria já na identificação, porque a carga horária é gravada nesse momento.

### 3.3. `index.html` — interface e lógica

Concentra o CSS (tema de inspiração bibliográfica: verde-tinta, dourado de lombada,
papel; *rail* escuro como superfície), o HTML das telas e o `<script>` com a lógica.

**Paleta e significado das cores.** As variáveis vivem em `:root` com nomes em
pt-BR (`--tinta`, `--papel`, `--ficha`, `--verde`, `--dourado`, `--grafite`,
`--linha`, `--raio`). **Verde é aprovado, dourado é pendente** — as cores carregam
significado e não devem ser reaproveitadas decorativamente. Duas variáveis de linha
dividem trabalho e não são intercambiáveis: `--linha` desenha **estrutura** (cartão,
tabela, painel) e `--linha-campo` desenha **controle** (campo, chip, botão
secundário), com o contraste que a WCAG pede para contorno de componente — ver 6.3.
As cores vieram de uma
maquete escrita em `oklch()` e foram convertidas para hexadecimal, para a folha
continuar legível a quem nunca viu essa notação.

Funções-chave do script principal:

| Função | Responsabilidade |
|---|---|
| `conectarSilencioso` / `aposConectar` | Reconecta a pasta memorizada; valida o selo de instalação e define `situacaoPasta`. |
| `carregarConfig` | Lê `config.json` e popula o objeto global `CFG` (ou mantém a semente). |
| `oficializarPasta(pessoa)` | Grava o selo de instalação (UUID + autor + data) no `config.json`. Só o adm. |
| `montarPessoas` | Constrói a lista do seletor de identidade a partir de `CFG`; restringe ao adm se a pasta não for oficial. |
| `identificar(pessoa, carga)` / `limparIdentidade` | Efetiva/limpa a identidade; controla travamento, rail e telas. |
| `senhaConfere` / `sha256hex` | Validação de senha por *hash* SHA-256 de `nome + '|' + senha`. |
| **`podeVer(v)` / `irPara(v)`** | **(v14)** Regra de alcance por papel e troca de tela. |
| **`ajustarRail` / `ajustarConfig`** | **(v14)** Mostram no rail só o que o papel alcança; devolvem à tela de entrada quando pasta ou identidade se desfazem. |
| **`atualizarArquivoPessoa(unidade, nome, mudar)`** | **(v11)** **Ponto único de escrita** do arquivo da pessoa: lê o estado atual, aplica a mudança e regrava o conjunto. |
| **`normalizar` / `palavras` / `radical` / `casa`** | **(v9)** Busca sem acentos e com radicalização aproximada do português. |
| **`montarFrequentes`** | **(v9)** Três atalhos derivados do histórico da própria pessoa. |
| **`escapar(s)`** | **(v13)** Escapa todo texto vindo de fora do código-fonte antes de entrar em `innerHTML`. |
| **`desempenho(regs, ausencias)`** | **(v11)** Calcula dias, pontos, média e percentual da meta. |
| **`diasCorridos` / `sobrepoe` / `ausenciasFiltradas`** | **(v11)** Aritmética e filtros de ausência. |
| **`mostrarRecibo` / `mostrarReciboAus`** | **(v11)** Recibo modal do lançamento e da ausência. |
| `recarregar` | Relê os dados da rede conforme o perfil e chama `render()`. |
| `render` | Monta as duas tabelas (painel e "Meu mês"), cabeçalhos de dia, totais, cartão "Hoje", resumo por pessoa e contadores. |
| **`irAba(k)` / `desenhoPendente`** | **(v14)** Abas do painel e resgate do gráfico adiado. |
| **`renderVis` / `desenharGraficos` / `desenhar`** | **(v10/v12)** Indicadores e gráficos ECharts. |
| `aplicarAprovacao(registros, aprovar)` | Grava aprovações no arquivo do nível responsável (unidade ou `GERAL`) e explica o que não pôde ser desfeito. |
| `excluirLancamento` / `excluirAusencia` | Exclusões, sempre pelo ponto único de escrita. |
| `renderAdm` / `salvarCFG` | Renderiza e persiste o painel de administração (senhas, exigência, catálogo, selo). |
| `baixarCSV` / `linhasCSVLancamentos` | Exportação em CSV das duas telas que exportam lançamentos. |

**Estilo de código.** `"use strict"`, identificadores em pt-BR (`lancamento`,
`aprovacao`, `servidoresDe`, `garantirPermissao`), banners de seção
`/* ===== TÍTULO ===== */`, comentários que explicam o *porquê* (não o *quê*), e
pequenos predicados de papel (`ehServidor()`, `ehChefia()`, `ehGeral()`, `ehAdm()`,
`ehMeu(r)`) em vez de comparações de string espalhadas.

### 3.4. `echarts.min.js` — a única biblioteca

Build **próprio** do ECharts, contendo apenas o que o aplicativo usa: barra, mapa de
calor, eixo, dica, legenda e escala de cor. São 521 KB contra 1 MB do pacote
completo. Fica **na pasta do aplicativo** e é registrado no `sw.js`; nunca use CDN,
porque o service worker é *cache-first* e a máquina pode estar sem internet. Ao
trocar a biblioteca por uma versão nova, publique uma versão do aplicativo — o
`echarts.min.js` está na lista `ARQUIVOS` do `sw.js`, e sem uma chave de cache nova
quem já abriu o aplicativo continua recebendo a biblioteca antiga.

É um `<script>` comum, como `catalogo.js` e `rede.js`: sem internet, sem build, sem
npm.

### 3.5. `sw.js` — service worker

*Cache-first* para o programa, **rede-first para o `catalogo.js`**: no `install`,
abre um cache nomeado pela constante `VERSAO` e grava a lista `ARQUIVOS`; no
`activate`, apaga todo cache cujo nome não seja o `VERSAO` atual; no `fetch`,
responde com o cache e só vai à rede se não houver correspondência — exceto para
o `catalogo.js`, que desde a 1.10 tenta a rede primeiro, guarda no cache o que
voltar e cai no cache quando a rede falta.

A exceção existe porque o `catalogo.js` é **dado editável**, e não parte do
programa: servi-lo do cache congelava as edições até a publicação de uma versão
nova, e congelava em silêncio, porque um catálogo velho é idêntico a um correto
na tela. Um prazo de 2,5 s (`REDE_PRAZO`) impede que esta — a única requisição
que toca a rede — trave a abertura quando o servidor aceita a conexão e não
responde; esgotado o prazo, vale o cache. Só resposta `ok` é gravada, para que um
404 ou 500 momentâneo não vire falha permanente. Nada disso afeta quem abre por
`file://`, onde não há service worker registrado.

```js
importScripts("./versao.js");
const VERSAO = "ra-" + APP.versao;
const ARQUIVOS = ["./", "./index.html", "./versao.js", "./catalogo.js",
                  "./rede.js", "./echarts.min.js", "./manifest.webmanifest",
                  "./icons/icon-192.png", "./icons/icon-512.png",
                  "./ajuda/rail.webp", "./ajuda/lancar.webp",
                  "./ajuda/busca.webp", "./ajuda/painel.webp"];
```

O `importScripts` é o que permite ao service worker — que roda em outro contexto,
sem DOM e sem acesso ao `index.html` — ler a mesma versão que a tela mostra. Um
`const` declarado no topo de um script clássico importado fica visível ao script
que o importou, por estarem no mesmo escopo global.

Consequência prática: **uma alteração publicada sem trocar a versão no `versao.js`
não chega a ninguém que já tenha aberto a versão anterior.** Ao testar mudanças em
arquivos cacheados, use recarregamento forçado — uma versão desatualizada serve
alegremente o cache antigo e esconde a alteração.

Note que `versao.js` **está** na lista de arquivos cacheados: fora dela, o service
worker buscaria da rede um arquivo de que ele próprio depende. Já o
`gerar-senha.html` não está, por ser ferramenta avulsa do administrador: ela não
abre offline.

### 3.6. Onde a versão é escrita

Um arquivo de quatro linhas úteis, lido por dois contextos diferentes:

```js
const APP = {
  versao:      "1.1",                  // acompanha a tag do repositório
  rotulo:      "versão 1.1 (ago/26)",  // etiqueta exibida no rail
  atualizado:  "10.08.2026",           // data desta publicação
  repositorio: "https://github.com/ErnyBSB/resultados"
};
```

Antes da v1.1 o número era digitado à mão em dois lugares — a etiqueta do rail e a
`VERSAO` do `sw.js` — e a divergência entre eles tinha um efeito ruim e silencioso:
a tela anunciava a versão nova enquanto o navegador continuava servindo os arquivos
da anterior, porque o cache não havia trocado de nome.

A data de atualização é preenchida à mão de propósito. Buscá-la da API do GitHub
exigiria uma requisição de rede, e o aplicativo existe para funcionar sem internet:
a data ficaria vazia ou velha exatamente na situação de uso prevista. Sendo manual,
ela fica na linha seguinte à da versão — quem troca uma vê a outra.

---

## 4. Modelo de dados (esquemas JSON)

Todos os dados persistidos são JSON. Os esquemas abaixo são o contrato entre as
partes do sistema; qualquer alteração neles deve considerar compatibilidade com
arquivos já gravados.

### 4.1. Lançamento (registro individual)

Cada item do array `registros` em `<unidade>/lancamentos/<pessoa>.json`:

```js
{
  id:           '1730050000000-a1b2c',   // Date.now() + sufixo aleatório (único)
  data:         '2026-08-03',            // ISO aaaa-mm-dd
  unidade:      'SEORE',                 // ou 'GERAL' para a chefia geral
  servidor:     'Ana Beatriz Nunes',         // nome de quem lançou
  papel:        'servidor',              // 'servidor' | 'chefia' | 'geral'
  processo:     'Tratar conteúdo ...',
  atividade:    'Realizar o processamento técnico ...',
  complexidade: 'm',                     // 'b' | 'm' | 'a'
  pontos:       10,                      // derivado de PONTOS[complexidade]
  cargaHoraria: 6,                       // NOVIDADE v11 — 8 ou 6, vigente no dia
  obs:          ''                       // observações livres (opcional)
  // abono: true                         // SÓ em lançamentos até a v10 (ver 4.6)
}
```

**Papel é decisivo:** o campo `papel` determina quem aprova o lançamento. Registros
de papel `servidor` são aprovados pela chefia da unidade (ou, desde a v12, pela
chefia geral); registros de papel `chefia` ou `geral` são aprovados pela chefia
geral. Registros sem o campo (anteriores à v3) assumem `servidor`, pela função
`papelDe`.

**Por que a carga horária é carimbada no lançamento**, e não só no cabeçalho: quem
passa de 8h para 6h no meio do ano não deve ver as médias dos meses anteriores
mudarem retroativamente. O passado é calculado com a jornada que valia então.

### 4.2. Arquivo de lançamentos de uma pessoa (`versao: 3`)

```js
{
  versao: 3,
  unidade: 'SEORE',
  servidor: 'Ana Beatriz Nunes',
  cargaHoraria: 6,                       // NOVIDADE v11 — jornada atual (8|6|null)
  atualizadoEm: '2026-08-03T12:00:00.000Z',
  registros: [ { ...lançamento... }, ... ],
  ausencias: [ { ...ausência... }, ... ]  // NOVIDADE v11
}
```

O arquivo passou a guardar **três coisas**: carga horária, lançamentos e ausências.
Gravar só uma delas apagaria as outras duas. Por isso **toda escrita passa por
`atualizarArquivoPessoa()`**, que lê o estado atual (com a leitura estrita de 3.2),
aplica a mudança e regrava o conjunto:

```js
async function atualizarArquivoPessoa(unidade, nome, mudar) {
  const atual = await lerArquivoParaGravar(dirRaiz, unidade, nome);  // pode lançar
  const estado = {
    registros: (atual && atual.registros) || [],
    ausencias: (atual && atual.ausencias) || [],
    carga:     (atual && atual.cargaHoraria) || null
  };
  mudar(estado);
  await gravarMeuArquivo(dirRaiz, unidade, nome,
                         estado.registros, estado.carga, estado.ausencias);
  return estado;
}
```

> **Não chame `gravarMeuArquivo()` direto** ao acrescentar uma quarta coisa no
> futuro. O ponto único de escrita é o que impede que uma funcionalidade nova apague
> silenciosamente as antigas.

**Por que a carga não foi para o `config.json`:** aquele arquivo é gravado somente
pelo administrador. Se cada servidor precisasse escrever nele para marcar a própria
jornada, duas pessoas salvando ao mesmo tempo poderiam se sobrescrever, e as
permissões NTFS recomendadas (servidor sem escrita no `config.json`) impediriam a
gravação. No arquivo da própria pessoa não há esse problema: ela já é a única
escritora dele. O princípio do escritor único continua valendo sem exceção.

Consequência assumida: a carga é **autodeclarada**. O aplicativo não a confere
contra o RH — quem marcar errado registra errado, do mesmo modo que já acontece com
a complexidade de cada atividade.

### 4.3. Ausência (novidade da v11)

Cada item do array `ausencias`, no mesmo arquivo da pessoa:

```js
{
  id:       'aus-1730050000000-a1b2c',
  unidade:  'SEORE',
  servidor: 'Ana Beatriz Nunes',
  papel:    'servidor',
  tipo:     'ferias',        // chave "k" de TIPOS_AUSENCIA — NÃO renomear
  de:       '2026-08-28',    // primeiro dia (inclusive)
  ate:      '2026-09-10',    // último dia (inclusive)
  obs:      ''               // opcional
}
```

Ausência **não é lançamento**: não vale pontos, não aparece na tabela de atividades
e **não passa por aprovação** (decisão de projeto — quem registra é a própria pessoa
e o dado é informativo). Períodos sobrepostos são recusados, com a ausência
conflitante citada na mensagem: sobreposição é quase sempre digitação repetida e
contaria o mesmo dia duas vezes na meta.

### 4.4. Arquivo de aprovações (`aprovacoes.json`)

Um por unidade e um em `GERAL/`. Mapa indexado pelo `id` do lançamento:

```js
{ versao: 1, unidade: 'SEORE', chefe: 'Nome da Chefia',
  atualizadoEm: '...',
  aprovacoes: {
    '1730050000000-a1b2c': { por: 'Nome da Chefia', em: '2026-08-04T...' },
    ...
  } }
```

A ausência de uma chave significa "pendente". Aprovar cria a entrada; desfazer a
remove. A separação em dois arquivos reflete o princípio do escritor único — e,
desde a v12, a **leitura** consulta os dois (ver 2.2).

### 4.5. Configuração central (`config.json`)

```js
{
  versao: 1,
  atualizadoEm: '...',
  unidades: { 'SEORE': { chefia: 'Nome'|null, servidores: ['...'] }, ... },
  chefiaGeral: 'Nome' | null,
  senhas: { 'Nome': 'hash-sha256', ... },
  exigirSenha: false,
  mostrarAusencias: false,     // NOVIDADE v1.3 — seção em avaliação (ver 6.7)
  instalacao: { id: 'uuid', por: 'Administrador', em: '...' }   // selo (v7+)
}
```

O `config.json` **não é mais criado automaticamente**: a criação e a oficialização
são ato exclusivo do administrador (ver seção 9).

### 4.6. Compatibilidade retroativa

Arquivos já gravados na pasta de rede **têm de continuar abrindo**. Entradas de
versões anteriores não têm campos que hoje existem, e o tratamento é sempre por
ausência explícita, nunca por migração ou reescrita dos arquivos das pessoas:

| Campo ausente | Origem | Tratamento |
|---|---|---|
| `papel` | pré-v3 | `papelDe(r)` assume `'servidor'`. |
| `cargaHoraria` (no lançamento) | pré-v11 | O dia fica fora do percentual e é contado à parte (`diasSemCarga`); no CSV a coluna sai **vazia**, nunca zero. |
| `cargaHoraria` (no cabeçalho) | pré-v11 | `lerCargaHoraria` devolve `null`; a pessoa marca a jornada uma vez e segue. |
| `ausencias` | pré-v11 | Tratado como lista vazia. |
| `mostrarAusencias` | pré-v1.3 | Lido com `=== true`: a falta da chave significa **oculto**, que é o estado em que a seção entrou em avaliação. |
| `abono: true` | pré-v11 | Continua exibido com a etiqueta "abono" na tabela e exportado na coluna "Abono" do CSV. **Não houve migração para ausências**: um lançamento de abono não guarda período, e inventar um a partir da data isolada produziria dado falso. Nos lançamentos novos a coluna sai vazia. |

---

## 5. Perfis, permissões e cadeia de aprovação

Existem quatro perfis. O perfil de uma pessoa é derivado de onde seu nome está
cadastrado na configuração — nunca escolhido livremente na tela —, o que elimina
inconsistências de identidade (correção introduzida na v4).

| Perfil | Registra? | Aprova | É aprovado por | Visualiza |
|---|---|---|---|---|
| Servidor | Sim | — | Chefia da unidade (ou chefia geral) | Os próprios lançamentos e ausências |
| Chefia da unidade | Sim | Servidores da sua unidade | Chefia geral | Toda a sua unidade |
| Chefia geral | Sim | **Qualquer lançamento** (v12): chefias, servidores e os próprios | Si mesma | Todas as unidades |
| Administrador | Não | — (não aprova) | — (não é aprovado) | Tudo (para correção) |

**A chefia geral aprova tudo (v12).** Até a v11 ela só aprovava lançamentos das
chefias de unidade e os seus próprios; os dos servidores apareciam apenas como
leitura. A via ordinária não mudou — o normal continua sendo a chefia da unidade
aprovar os servidores dela —, mas a chefia geral passa a poder fazê-lo também, útil
quando a chefia da unidade está afastada, o cargo está vago ou há acúmulo de
pendências.

**Autoaprovação da chefia geral:** por definição do fluxo, ela aprova os próprios
lançamentos no painel geral; não há nível acima dela. Já a chefia de unidade não
consegue aprovar a si mesma — seus lançamentos ficam pendentes até a chefia geral
agir. A interface só oferece o controle a quem tem alçada, via `podeAprovar`, e a
regra é reafirmada no código de navegação (`podeVer`), porque **esconder um botão
não é controle de acesso**.

**Administrador:** não registra atividades nem aprova. Suas atribuições são
gerenciar senhas (definir/alterar/remover, inclusive a própria; a senha inicial é
`adm`), ativar a exigência global de senha, excluir qualquer lançamento para
correção de erros (removendo também a aprovação órfã, se houver), excluir ausências
de qualquer pessoa e editar o catálogo de unidades/chefias/servidores. Também é o
único que oficializa a pasta central. Como não lança nada, o grupo "Meu trabalho"
inteiro desaparece do rail para ele, e o campo de carga horária nem chega a
aparecer.

**Exclusões:** um lançamento só pode ser excluído pelo próprio autor **enquanto
pendente** — ou pelo administrador, a qualquer momento, inclusive aprovado. Uma
ausência pode ser excluída pela própria pessoa a qualquer momento (não há estado
"aprovado" para travar) ou pelo administrador; a chefia enxerga, mas não apaga.

### 5.1. Passo a passo do uso

1. **Conectar a pasta (etapa 1):** a pessoa seleciona a pasta central no navegador;
   a escolha fica memorizada no IndexedDB. Nas sessões seguintes basta "Reconectar".
2. **Validação do selo:** o app lê o `config.json`. Se a pasta não for oficial e a
   pessoa não for o adm, o acesso é barrado.
3. **Identificar-se (etapa 2):** escolha do nome; senha, se houver cadastrada (ou se
   for o adm); e **marcação da carga horária diária** (8h ou 6h), obrigatória para
   quem registra atividades. A identidade trava para a sessão e fica memorizada
   neste navegador, como um "lembrar-me".
4. **Operar:** servidor e chefias registram e acompanham; chefias aprovam; adm
   administra.
5. **Atualizar dados da rede:** relê os arquivos para refletir o que outras pessoas
   gravaram. Não há atualização em tempo real.

**Por que a carga horária é obrigatória.** Sem ela o botão "Confirmar identidade"
não passa. Presumir 8h para quem não marcou seria pior do que perguntar:
contaminaria em silêncio a média de todo mundo que cumpre 6h. A cobrança acontece
uma única vez por pessoa — nas vezes seguintes o valor já vem marcado, **lido do
arquivo da rede** (e não do navegador), para que uma troca de jornada feita em outra
máquina valha em todas. A gravação acontece *antes* de a identidade travar: se a
rede recusar a escrita, a pessoa continua na etapa 2 e vê o motivo, em vez de seguir
com uma carga que só existiria naquela aba.

---

## 6. Interface: telas, rail e abas

*(redesenho da v14, mantido na 1.0)*

Até a v13 o aplicativo era **uma página que crescia para baixo**: conectar a pasta,
identificar-se, lançar, ausências, totais e o painel inteiro, tudo na mesma
rolagem. Funcionava enquanto havia pouca coisa. Com a v12 já não havia: para a
chefia, o painel de aprovação — motivo pelo qual ela abre o aplicativo — ficava três
telas abaixo do formulário de lançamento, que ela quase nunca usa.

A v14 trocou a rolagem única por **telas**, com um rail de navegação fixo à
esquerda:

```
MEU TRABALHO           GESTÃO
 Lançar atividade       Painel da unidade  (3)
 Meu mês       86%      Administração
 Ausências
```

Os dois grupos separam o que a pessoa **faz** do que ela **fiscaliza**. Quem não
fiscaliza nada não vê o segundo grupo — o servidor tem três telas, e pronto. O
número ao lado de "Painel da unidade" é a quantidade de lançamentos esperando
aprovação de quem está olhando; o percentual ao lado de "Meu mês" é a meta
alcançada. Antes era preciso entrar na tela para descobrir se havia algo a fazer
nela.

### 6.1. As telas

| Tela | Quem alcança | O que mostra |
|---|---|---|
| **Entrada** | todos | As duas etapas: pasta da rede e identificação. Some assim que as duas estão resolvidas e volta quando alguma se desfaz. |
| **Lançar atividade** | quem registra (não-adm) | Formulário em três passos numerados (atividade, complexidade, observações) e, à direita, o efeito imediato: quanto já foi lançado na data, quanto falta para a meta do dia e a lista do que entrou. Abaixo do botão, o arquivo em que aquilo será gravado. A data do lançamento não passa do dia corrente: o calendário cinza os dias futuros, e o teto é recalculado a cada foco no campo, para não envelhecer numa aba deixada aberta de um dia para o outro. |
| **Meu mês** | quem registra | A meta em tamanho grande, com a explicação do que ela mede logo abaixo do número; pontos no mês; aguardando chefia; e a tabela dos próprios lançamentos, com exportação CSV. |
| **Ausências** | quem registra | Formulário de período à esquerda, lista à direita. |
| **Painel** | chefia, chefia geral, adm | Três abas: Aprovações, Visão do mês e Ausências. |
| **Administração** | adm | Selo da pasta, senhas e catálogo. |

**Origem do desenho.** De uma maquete feita em React, com fontes e bibliotecas
baixadas da internet, que serviu de **especificação, não de código**. A maquete
baixava React, ReactDOM e Babel de um CDN a cada carregamento — aberta da pasta de
rede numa máquina sem internet, que é exatamente o cenário para o qual este
aplicativo existe, a tela ficaria em branco. Nada no desenho exigia framework: rail
à esquerda e troca de telas são `<nav>` e mostrar/esconder. Duas coisas foram
**acrescentadas** ao desenho: tratamento de tela estreita (o rail vira barra
horizontal rolável abaixo de 900px, e as duas colunas viram uma) e **foco visível**
(a maquete zerava o estilo dos botões com `all:unset`, o que apaga o anel de foco e
cega quem navega por teclado).

### 6.2. Abas do painel

O acordeão da v12/v13 (`<details>/<summary>`, cinco seções, estado guardado em
`ra.secoes.v1`) foi substituído por três abas: **Aprovações**, **Visão do mês** e
**Ausências**. O acordeão permitia abrir tudo ao mesmo tempo, o que na prática
ninguém fazia; e, fechado, não dizia quais eram as partes. A aba escolhida fica
guardada em `ra.aba.v1`, e as setas esquerda/direita percorrem as abas, como manda
o padrão ARIA.

**Aprovar virou botão.** Na v13, aprovar era marcar uma caixa de seleção de 13×13
pixels — alvo pequeno demais para a ação mais repetida de quem usa o painel, e ainda
dentro de uma tabela que rolava na horizontal no celular. Agora é um botão
"Aprovar" na própria linha. Já aprovado, o botão dá lugar à etiqueta e a um
"desfazer" — e, quando a aprovação foi gravada pelo outro papel, nem isso: aparece
só quem aprovou e quando, porque desfazer ali não funcionaria.

**O total do dia virou cabeçalho.** Na v13 o total de cada dia era uma linha somada
*depois* das atividades daquele dia, com `colspan` fixo — o que desalinhava a coluna
Pontos quando a tela estreita escondia colunas. Agora o total **abre** o grupo:

```
SEGUNDA, 03/08/2026 · 40 pontos em 3 lançamento(s)
```

A faixa ocupa a largura inteira de propósito, então não há colunas a acertar.

**Tabelas em tela estreita.** As tabelas têm largura mínima (`min-width`). Sem ela,
a coluna ATIVIDADE era espremida até sobrar uma palavra por linha no celular. Agora
a tabela rola na horizontal **dentro do próprio quadro** — a página em si nunca rola
para o lado.

### 6.3. Escolha da atividade (novidade da v9)

Até a v8 a atividade era escolhida em duas listas suspensas: primeiro o processo,
depois a atividade. Isso obrigava a pessoa a adivinhar sob qual processo sua tarefa
estava classificada, e os textos (até 205 caracteres) apareciam cortados dentro da
lista. Hoje:

- **Campo de busca único** sobre todas as 72 atividades. Vários termos, em qualquer
  ordem, filtram enquanto se digita, com o processo de cada atividade como legenda e
  os trechos casados realçados.
- **Sem acentos e com radicalização**: quem digita "catalogar" encontra
  "catalogação"; "indexar" encontra "indexação". A lista `SUFIXOS` remove
  terminações comuns do português, preservando pelo menos três letras de base (para
  não reduzir "doação" a "d"). *Recall* importa mais que precisão aqui — a lista é
  curta.
- **Texto integral visível** antes de registrar.
- **Teclado**: setas percorrem, Enter escolhe, Esc fecha; `role="combobox"`,
  `aria-expanded` e `aria-activedescendant` mantidos em dia.
- **Ordem alfabética** (v14), com `localeCompare` em pt-BR — assim "ação" fica junto
  de "acao" e o "ç" cai no lugar do "c". Ordenando por código de caractere, tudo que
  tem acento iria para o fim da lista, depois do "z". A ordem antiga era a de
  digitação no `catalogo.js`: fazia sentido para quem edita o arquivo e nenhum para
  quem lê a lista na tela.
- **Filtro por processo** continua opcional e, desde a #19, está **sempre visível e
  antes do campo de busca** — era revelado por um link e vinha depois. Fica fora do
  painel cinza e mais estreito que ele, para que a hierarquia continue dizendo que a
  busca é o caminho geral (ver a dívida declarada no LEIA-ME: a ordem na tela
  reencena o "escolha o processo primeiro" que a v9 aboliu).
- **"Suas mais registradas"**: três botões de um clique, derivados do histórico da
  própria pessoa. Eram cinco até a v13; cinco atalhos ocupavam mais tela que o
  próprio campo de busca. As atividades que saíram do catálogo são descartadas
  **antes** do corte em três — cortando primeiro, uma atividade removida do catálogo
  levava embora uma das vagas e o atalho aparecia com dois botões, sem motivo
  visível. **Desde a v1.4 os atalhos vêm depois do campo**, e não antes (ver abaixo).

**O destaque do campo (v1.4).** O campo e os atalhos tinham o mesmo fundo e a mesma
borda, e o campo era a quarta caixa idêntica de uma pilha de quatro, a três atalhos
de distância da pergunta que responde. O destaque **não podia vir de cor** — verde é
aprovado, dourado é pendente, e emprestar um dos dois para decoração desmancharia a
convenção. Veio da **superfície**: o campo mora num painel `--papel` dentro do cartão
branco e continua branco por dentro, invertendo a relação; ganhou rótulo visível (era
um `<label>` fora da tela, só para leitor de tela) e recebeu, dentro do painel, o
texto de apoio que explica como ver a lista inteira — 4,87:1 de contraste sobre o
cinza, acima do mínimo AA. A ordem inverteu porque o campo é o caminho do caso geral;
o atalho vem depois dele.

**Contraste e ênfase (issue #19).** Depois de alguns dias de uso, os servidores
apontaram quatro coisas no cartão: pouco contraste entre as peças, o filtro escondido
atrás de um link, a ordem do filtro e a falta de ênfase nos atalhos. O contorno dos
campos era `--linha` (#D7DCD8), **1,39:1** sobre o branco, abaixo dos 3:1 que a WCAG
1.4.11 pede para o contorno que identifica um controle. Passaram a existir **duas
linhas com papéis distintos**: `--linha` para estrutura (cartão, tabela, painel) e
`--linha-campo` (#7E8A83, **3,59:1** no branco e **3,19:1** no `--papel`) para
controle — campo, chip e botão secundário, em todas as telas. Chip desabilitado é a
exceção e volta ao fio de estrutura: continua legível, porque diz quais complexidades
a atividade admite, mas não promete clique.

A ênfase dos atalhos "Suas mais registradas" não podia vir de cor (verde é aprovado,
dourado é pendente) nem de fundo `--papel`, que é o fundo de controle desabilitado e
faria os três botões parecerem indisponíveis. Veio do contorno firme mais uma **régua
de 3px à esquerda** em `--rail-ponto` (#4A564E, 7,69:1), o tom neutro da paleta; e o
rótulo da seção subiu do `.rotulo` de 10,5px para o mesmo posto do rótulo da busca.
Nenhum texto de tela mudou.

### 6.4. Recibo do lançamento (novidade da v11)

Ao registrar uma atividade abre-se um `<dialog>` modal com o recibo do que foi
gravado: data, atividade, processo, complexidade e pontos, observações, a situação
("Pendente de aprovação pela chefia da unidade", ou pela chefia geral, conforme o
papel) e o total de pontos no mês já atualizado. A janela precisa ser fechada à mão.
A mesma janela confirma o registro de uma **ausência**, com tipo, período, dias
corridos e o lembrete de que ausências não passam por aprovação.

Antes disso a única resposta era um aviso verde que sumia em 6 segundos: quem
desviava o olhar não sabia dizer se o lançamento tinha ido para a rede, e relançava
por via das dúvidas.

> **Detalhe de implementação que não pode ser perdido:** o recibo é exibido **fora**
> do `try/catch` da gravação. O lançamento já está na rede quando ele aparece; se
> algo falhasse ao montar a janela dentro do `try`, a pessoa veria "não foi possível
> gravar na rede" e lançaria tudo de novo, duplicando o registro.

### 6.5. Sobre o programa (novidade da v1.1)

No rail, **abaixo do último item** e separado por uma linha, o botão "Sobre o
programa" abre uma janela modal com a identidade do aplicativo: nome, versão, para
que serve, licença (Creative Commons CC0 1.0, a mesma do arquivo `LICENSE`), onde
foi elaborado, data da última atualização e endereço do repositório. Fecha pelo
botão "Fechar" ou pela tecla Esc, e devolve o foco ao botão que a abriu.

Três decisões que valem registro:

- **O botão vive fora de `#railNav`.** A lista de telas fica oculta enquanto
  ninguém se identificou, e é justamente antes de entrar que alguém pode querer
  saber o que é este programa. Dentro da lista, ele também seria lido como o último
  item do grupo "Gestão", ao qual não pertence.
- **Janela própria, e não mais um uso do `dlgRecibo`.** Aquela janela já serve a
  dois assuntos e devolve o foco ao campo de busca de atividade ao fechar, o que
  aqui estaria errado.
- **O conteúdo entra por `textContent` e pela propriedade `href`**, nunca por
  `innerHTML`. É a forma mais forte da regra de 10.2: onde não há marcação a
  montar, não se abre a porta para ela.

Para que a navegação em coluna colocasse o botão logo abaixo do último item — e não
no pé do rail —, a lista de telas deixou de crescer (`flex:0 1 auto`) e quem passou
a ser empurrado para o fim é o rodapé (`margin-top:auto`). Em tela estreita, onde o
rail vira faixa horizontal, o botão fica numa linha própria abaixo dela.

### 6.6. Ajuda (novidade da v1.2)

Uma tela, alcançável pelo rail logo acima de "Sobre o programa", com sete blocos: o
que o programa é e o que ele não é; quem aprova o quê; como a tela se organiza; como
lançar; como achar a atividade certa; ausências e o que a meta mede; e o que fazer
quando algo não funciona. Quatro capturas em `code/ajuda/`.

**Por que embutida, e não no GitHub.** Foi a pergunta discutida antes de escrever a
primeira linha (registrada na issue #4). O objetivo nº 1 do projeto é funcionar sem
rede externa, e ajuda hospedada fora inverte essa lógica no pior momento: quem clica
em "Ajuda" está travado agora, e um link que não abre ensina que o programa está
quebrado. O custo assumido é o inverso: **corrigir a ajuda passa a exigir publicar
uma versão**. Aceitável porque o que está embutido é a parte estável — muda quando o
aplicativo muda, e aí a versão nova já está sendo publicada de qualquer forma.

**Por que uma tela, e não páginas HTML soltas.** A folha de estilo do aplicativo é
embutida no `index.html`; páginas separadas precisariam de uma cópia dela, e cópias
divergem. Abrir outra aba também tira a pessoa de dentro do programa.

**Três ajustes que o alcance antes da identificação exigiu** — vale conhecê-los antes
de mexer na navegação:

| Função | O que fazia | O que passou a fazer |
|---|---|---|
| `irPara(v)` | Barrava toda tela que não fosse `entrada` sem pasta e sem identidade | A `ajuda` escapa da barreira: não depende de dado nenhum |
| `podeVer(v)` | A última linha (`return !ehAdm()`) barraria o administrador | `ajuda` devolve verdadeiro em qualquer papel |
| `ajustarConfig()` | Devolvia à entrada sempre que pasta ou identidade faltassem | Não desvia quem está na ajuda — a reconexão silenciosa arrancava a pessoa da leitura |

Como o rail de telas fica oculto antes da identificação, a tela tem um botão
**"Voltar"** próprio, que devolve à tela de origem (`vistaAnterior`). Sem ele, seria
uma sala sem porta.

**As capturas.** Quatro, em WebP (189 KB; em PNG seriam 671 KB) — o formato é seguro
porque o aplicativo é Chrome/Edge por decisão de projeto. Estão em `ARQUIVOS`, no
`sw.js`: fora daquela lista apareceriam quebradas justamente na máquina sem rede.
Foram geradas com **dados inventados**, nunca com o catálogo real — o repositório é
público. Cada `<img>` tem `alt` descritivo, de modo que ninguém dependa da imagem
para entender o texto.

### 6.7. Seções em avaliação: Ausências oculta (novidade da v1.3)

A seção **Ausências** — a tela do servidor e a aba do painel — está oculta enquanto
a gestão discute o assunto. **Nada foi removido**: o código está inteiro, os
arquivos das pessoas continuam guardando as ausências já registradas, e
`desempenho()` continua tirando da conta os dias cobertos por elas. Só o que
aparece na tela mudou.

**Onde mora a decisão.** No `config.json`, na chave `mostrarAusencias`, gravada
apenas pelo administrador — portanto igual para todos, e não uma preferência de
cada navegador. O administrador liga e desliga num cartão "Seções em avaliação",
no painel dele; os demais recebem o efeito no próximo "Atualizar dados da rede".
O padrão é oculto: um `config.json` anterior à v1.3 não tem a chave, e a leitura
(`cfg.mostrarAusencias === true`) trata a falta dela como "não mostrar".

**O que a chave alcança:**

| Alvo | Como |
|---|---|
| Item "Ausências" no rail | `ajustarRail()` |
| A tela em si, por qualquer caminho | `podeVer("aus")` — esconder o botão não bastaria |
| Aba "Ausências" do painel | `aplicarAusencias()`; e `irAba()` volta para "Aprovações" quando a aba guardada em `ra.aba.v1` é a oculta, para o painel não abrir em branco |
| Trechos de texto que citam ausências | atributos `data-ausencias` / `data-sem-ausencias` no HTML |

**Textos em duas redações.** Três frases explicam a meta citando as ausências
("dias sem lançamento e dias de ausência ficam fora do cálculo"). Com a seção
desligada, a frase fala de algo que a pessoa não tem como ver; e apagar só o
trecho do meio deixaria a pontuação sem sentido. Por isso essas frases existem em
duas redações no HTML — `data-ausencias` e `data-sem-ausencias` —, e
`aplicarAusencias()` mostra uma e esconde a outra. É repetição assumida: o preço
de manter as duas versões honestas sem montar texto por JavaScript.

As capturas do rail e do painel foram refeitas sem a seção. Uma imagem que mostra
um item inexistente ensina o caminho errado com a confiança de uma fotografia.

---

## 7. Carga horária, meta alcançada e ausências

*(novidades da v11 — o núcleo conceitual do "Programa de Resultados")*

### 7.1. A meta

A meta é medida por **dia trabalhado**, conforme a carga horária:

| Jornada | Meta diária |
|---|---|
| 8 horas | 15 pontos |
| 6 horas | 11 pontos |

Os valores ficam em `META_DIARIA`, no `catalogo.js`, e são editáveis.

### 7.2. Como o percentual é calculado

```
percentual = pontos dos dias que contam / meta somada desses dias
```

O denominador **não é o mês inteiro**. Contam apenas os dias em que a pessoa
efetivamente lançou atividade. Ficam de fora:

- **dias sem lançamento nenhum** — o sistema não sabe se houve trabalho sem
  registro, folga ou esquecimento, e chutar qualquer um dos três produziria número
  errado;
- **dias cobertos por uma ausência registrada** — e aí os pontos daquele dia saem
  **também do numerador**: tirar o dia da conta e manter os pontos dele inflaria o
  percentual.

Quando a carga do dia varia (alguém que passou de 8h para 6h no meio do mês), cada
dia entra com a meta que valia nele — daí a **soma** das metas, e não uma
multiplicação por um número fixo.

O percentual usa **todos** os lançamentos do mês, aprovados ou pendentes: a meta
mede o trabalho feito, não a velocidade da chefia em aprovar. Ele obedece aos
filtros do painel, como todo o resto.

**Quando aparece "—" ou "meta não calculável":** lançamentos anteriores à v11 não
têm carga gravada, e sem ela não há meta para o dia. Esses dias ficam fora do
percentual e são contados à parte ("N dia(s) fora da conta"). Se nenhum dia do mês
tiver carga, o percentual não é exibido — melhor um traço do que um número
inventado.

### 7.3. Limite importante de leitura

> Quem lançou em 2 dias e bateu a meta nos 2 aparece com **100%**, igual a quem
> lançou em 20 dias.

O percentual mede a **intensidade** dos dias trabalhados e registrados, não a
assiduidade nem o volume total. Para julgar volume, olhe os pontos e o número de
dias — que estão ao lado. Por isso **o número nunca é exibido sozinho**: vem sempre
acompanhado de "em N dia(s)", e a explicação está impressa na tela "Meu mês", logo
abaixo do número, e não escondida numa dica.

Isso é consequência direta da regra pedida (média só sobre dias com lançamento
efetivo) e **não é um defeito a corrigir**: dias sem lançamento não são prova de que
não houve trabalho.

### 7.4. Ausências por período

O *checkbox* "Lançamento referente a abono" saiu na v11. No lugar dele há uma tela
própria, onde se registra um **período** de afastamento: tipo, primeiro dia, último
dia e observação opcional.

**Por que virou período e não mais um checkbox:** abono marcado num lançamento só
dizia que *aquele* dia teve abono, e só existia se a pessoa tivesse lançado alguma
atividade naquele dia — férias de quinze dias, em que ninguém lança nada, eram
invisíveis para o sistema. O cálculo da meta precisa justamente do contrário: saber
os dias em que a pessoa **não tinha como** trabalhar.

**Dias corridos, não úteis:** a contagem exibida na tabela e no CSV inclui as duas
pontas e não desconta fins de semana nem feriados — o aplicativo não tem tabela de
feriados. Esse número serve para leitura humana; o percentual da meta **não o usa**.
Lá o que importa é outra coisa: se o dia de um lançamento cai dentro de algum
período de ausência, aquele dia sai da conta. Sábados e feriados nunca chegam a ser
problema porque, sem lançamento, o dia já não entrava no cálculo.

**No painel:** chefia de unidade, chefia geral e administrador têm uma aba própria
de Ausências, obedecendo aos mesmos filtros de mês, unidade e pessoa, com exportação
CSV própria. As duas tabelas (lançamentos e ausências) são separadas de propósito:
uma tem pontos e aprovação, a outra não tem nem uma coisa nem outra. Uma ausência
entra no mês filtrado se **encosta** nele em qualquer dia — férias de 28/08 a 10/09
aparecem em agosto e em setembro.

---

## 8. Visão gerencial: indicadores e gráficos

*(v10; ampliada para a chefia de unidade na v12)*

Na aba **Visão do mês** do painel aparecem quatro indicadores e dois gráficos:

- **Indicadores do mês:** lançamentos, pontos, % aprovado e pendentes.
- **Atividades por pessoa e complexidade** — barra horizontal empilhada. O
  comprimento da barra é o **número** de atividades; a divisão em três tons de azul
  mostra a composição por complexidade (mais escuro = mais complexo).
- **Atividades por unidade e complexidade** — mapa de calor. Quanto mais escura a
  célula, mais atividades; o número aparece dentro dela, inclusive o zero (célula
  clara e vazia parece dado faltando). **Some sozinho quando há uma única unidade em
  tela**, porque viraria uma linha de três células e não diria nada que a barra
  acima já não tenha dito.

Tudo obedece aos filtros do topo (mês, unidade, pessoa, situação) e sai dos
**mesmos dados da tabela** — se os números divergirem da tabela, é defeito. Os
gráficos não substituem a tabela nem o CSV: quem precisa do número exato lê a
tabela; os gráficos servem para achar onde olhar.

**Chefia de unidade (v12).** Vê os mesmos indicadores e gráficos, com os dados da
sua unidade. Não foi preciso filtrar nada: `recarregar()` já carrega apenas a
unidade dela, então o recorte "exceto os dados de outras unidades" sai do escopo dos
dados, não de uma regra de exibição. O **servidor** continua sem indicadores e sem
gráficos — dois blocos gerenciais para descrever a produção de uma pessoa só, que
ela já vê nos totais pessoais e no percentual da meta.

**Por que a ordem alfabética é o padrão.** O botão "ordenar por volume" existe, mas
não é o padrão, de propósito. Ordenar pessoas por quantidade transforma o painel num
*ranking* de produtividade, e o dado não sustenta essa leitura: o gráfico não
desconta ausências nem normaliza por jornada — quem tirou férias no mês aparece na
barra ao lado de quem trabalhou o mês inteiro; lançamentos de abono anteriores à v11
contam como atividade; e a complexidade de cada atividade é fixada no `catalogo.js`,
não pelo esforço real da pessoa. Duas unidades podem ter perfis opostos só porque o
catálogo classificou assim. **Use o gráfico para enxergar distribuição e carga, não
para comparar desempenho.** A nota abaixo do gráfico diz isso na tela.

**Pontos não viram um segundo gráfico.** `PONTOS = {b:5, m:10, a:15}` é função
direta da complexidade — pontuação e complexidade são a **mesma** informação. Por
isso pontos aparecem só como indicador numérico, nunca como um segundo gráfico ao
lado do de complexidade (seria o mesmo dado duas vezes) e nunca como segundo eixo do
mesmo gráfico.

**Desenho adiado.** O ECharts não consegue medir um contêiner que o navegador não
está exibindo: desenhar ali produziria um gráfico de altura zero. Por isso
`renderVis()` calcula tudo e, se a tela ou a aba não estiverem visíveis, guarda os
dados em `visPendente` e para; ao entrar no painel ou na aba, `desenhoPendente()`
executa o desenho. Quem nunca abre os gráficos nunca paga o custo de desenhá-los, o
que também deixa o painel mais leve em máquina fraca.

---

## 9. Selo de instalação e controle da pasta oficial

Introduzido na v7 para atender ao requisito de que somente o administrador defina a
pasta central e todos entrem apenas nela. O mecanismo contorna uma limitação do
navegador: o *handle* de pasta é intransferível entre máquinas, então não é possível
"empurrar" a pasta para os demais — cada pessoa a seleciona uma vez. O que o selo
garante é que a seleção só é aceita se apontar para a pasta certa.

Três situações possíveis (variável `situacaoPasta`):

- **`oficial`** — o `config.json` tem selo e ele confere com o memorizado neste PC:
  fluxo normal para todos.
- **`nao-oficializada`** — não há `config.json.instalacao`. A lista de identificação
  mostra apenas "Administrador"; ao confirmar sua identidade ali, ele **oficializa**
  a pasta (grava UUID + autor + data).
- **`divergente`** — a pasta tem selo diferente do já usado neste PC: acesso
  recusado a todos; só o adm pode adotar a nova pasta explicitamente. Isso evita
  apontar para a pasta errada e fragmentar os dados.

Uma identidade memorizada não vale em pasta não validada: ao detectar isso, o
aplicativo limpa a identidade de quem não for o adm.

*Nota histórica:* o defeito corrigido na v8 — a oficialização era disparada antes de
a identidade global `ident` existir, e `oficializarPasta` tentava ler `ident.nome` —
continua valendo como advertência. A correção passou a pessoa selecionada como
parâmetro (`oficializarPasta(pessoa)`). É um exemplo do cuidado necessário com a
ordem de inicialização do estado global.

---

## 10. Modelo de segurança e suas fronteiras

**Princípio honesto que orienta o projeto:** as proteções no aplicativo (senha,
papéis, selo) impedem o uso acidental ou casual de identidade e permissões alheias,
mas **não constituem controle de acesso forte**. Como todo o código roda no cliente
e os dados são arquivos numa pasta, uma pessoa determinada com acesso de escrita
pode contornar o app e editar os JSON diretamente.

A barreira real deve ser o sistema de arquivos (NTFS/AD). A recomendação de
implantação é configurar as permissões da pasta de modo que:

- cada pessoa tenha escrita apenas no próprio arquivo de lançamentos (ou na pasta
  `lancamentos` da sua unidade);
- cada chefia de unidade tenha escrita no `aprovacoes.json` da sua unidade (e no
  próprio arquivo de lançamentos);
- a chefia geral tenha escrita apenas na pasta `GERAL`;
- o administrador tenha escrita em `config.json` e, se desejada a exclusão
  administrativa, na árvore toda;
- os demais acessos sejam somente leitura.

Com isso, mesmo que alguém abra o app com um perfil indevido, a gravação falha no
nível do sistema operacional e o app exibe o erro. As senhas do app e as permissões
NTFS são camadas complementares: a senha é o cadeado da gaveta; o NTFS é a fechadura
do cofre. Sem as permissões o sistema continua funcionando — com risco maior de erro
humano.

> Note que o desenho de escrita descrito em 2.2 e 4.2 foi feito **para caber nessas
> permissões**. Toda funcionalidade nova deve perguntar: "com as permissões NTFS
> recomendadas, esta gravação ainda passa?"

### 10.1. Senhas

O `config.json` guarda apenas o *hash* SHA-256 de `nome + '|' + senha`, calculado no
navegador via Web Crypto — a senha em texto nunca é persistida. O administrador gera
*hashes* pelo próprio painel (ou pelo utilitário `gerar-senha.html`, que também
calcula tudo localmente e não envia nada a lugar nenhum). A senha inicial do
administrador é `adm` e deve ser trocada no primeiro acesso.

Com `exigirSenha: false`, quem tem *hash* cadastrado precisa da senha e quem não tem
entra livremente (fase de transição); com `true`, só entra quem tiver *hash*
cadastrado.

### 10.2. Escapamento de texto de terceiros (correção da v13)

O painel montava as linhas da tabela emendando texto direto no HTML. Como a
observação de um lançamento é campo livre, uma observação escrita com sinais de
marcação era lida **como marcação** — e não como texto — na hora em que a **chefia**
abria o painel para aprovar.

No dia a dia isso apareceria como uma linha embaralhada. No limite, porém, é mais
sério que estético: a sessão de quem abre o painel é justamente a que tem permissão
de escrita na pasta central inteira, e um trecho de código executado ali poderia
reescrever lançamentos, aprovações ou o próprio `config.json`.

A função `escapar()` já existia e já era usada corretamente na tabela de ausências;
faltava aplicá-la na de lançamentos, nos nomes vindos do `config.json`, nas listas de
seleção, na tela de administração e nas dicas dos gráficos.

> **Regra da casa, escrita como comentário ao lado da função:** todo texto que venha
> de fora do código-fonte — arquivo de outra pessoa na rede, `config.json`,
> `catalogo.js` — passa por `escapar()` antes de entrar em `innerHTML`, **inclusive
> dentro de atributos**. Isso vale também para os `formatter` das dicas do ECharts,
> que renderizam HTML.

O que isto **não é**: autenticação nem controle de acesso. Quem consegue editar os
JSON direto na pasta continua podendo — a proteção contra isso é a permissão NTFS.

### 10.3. Recusa de gravar por cima de arquivo ilegível (v11)

Descrita em 3.2. Vale repetir aqui porque é uma decisão de **segurança de dados**,
não de robustez cosmética: o aplicativo prefere **não gravar** e explicar o motivo,
mandando procurar o administrador, a arriscar apagar o histórico de alguém. A
identidade não é travada nesse caso, e a mensagem cita o nome do arquivo.

### 10.4. Bloco `[hidden]` (correção da v13)

Três quadros escuros apareciam zerados na primeira tela, antes de qualquer conexão,
embora o código mandasse escondê-los. Causa: o atributo `hidden` vale como
`display:none`, mas isso é estilo do **navegador**, e qualquer regra da folha que
declare `display` passa por cima dele — `.totais` declarava `display:grid` e
`.resumo`, `display:flex`. A correção é uma linha no alto da folha:

```css
[hidden]{display:none !important}
```

O `!important` aqui não é atalho preguiçoso — é exatamente a intenção: "oculto" tem
de ganhar de qualquer regra de `display`, inclusive das que forem escritas depois.

### 10.5. O que nunca vai para o repositório (novidade da v1.5)

O código vive num repositório **público**. A regra é curta: **nome de pessoa, senha
— mesmo em hash — e lançamento não são versionados.**

**Onde ficam as pessoas de verdade:** no `config.json` da pasta central da rede,
gravado pelo administrador através do painel. O `catalogo.js` do repositório traz
apenas a **semente**: as oito unidades com `servidores: []`, `chefia: null`,
`CHEFIA_GERAL = null` e `SENHAS = {}`. Nada se perde com isso, porque desde a v6 é
o `config.json` que manda em pessoas, chefias e senhas; a semente só é consultada
enquanto a pasta não foi oficializada. Consequência assumida: numa pasta virgem, o
administrador digita o catálogo uma vez, no painel.

**Por que o `catalogo.js` continua versionado.** Tirá-lo do controle de versão — a
leitura literal de "não guarde o arquivo real" — quebraria o aplicativo: o
`index.html` o carrega pelo nome, e num clone novo o script daria 404, `PROCESSOS`
e `ATIVIDADES` ficariam indefinidas e a tela abriria em branco. O arquivo fica; o
que sai dele são as pessoas. Processos e atividades permanecem: são o catálogo de
trabalho da COBIB, não dado pessoal.

**A grade:** o `.gitignore`, que antes não existia, barra `config.json`, as pastas
de teste que imitam a rede (`unidadeCentral/`, `dados/`, `teste*/`) e `*.local.js`.
É a parte mais útil da medida — sem ela, uma pasta de teste com dados reais entrava
num `git add -A` sem aviso nenhum.

**Capturas de tela** seguem a mesma regra e usam um elenco inventado; o mesmo
elenco aparece nos exemplos deste relatório e do LEIA-ME.

**O que a medida não desfaz.** Dois nomes reais circularam no repositório desde a
importação inicial e continuam nos commits antigos: limpar a árvore não reescreve a
história, e as cinco tags publicadas apontam para dentro dela. A decisão registrada
foi **aceitar** o que já está publicado — dois nomes de servidores públicos ligados
a uma unidade, sem lançamento, sem senha e sem `config.json` junto — em vez de
reescrever a história, o que recriaria o hash de todos os commits e das tags,
quebraria clones existentes e ainda assim não garantiria remoção imediata no
GitHub. O PDF das betas saiu da árvore pelo mesmo motivo: os nomes estavam dentro
do binário, que não se edita.

---

## 11. PWA, execução e implantação

**Execução mínima:** abrir `code/index.html` no Chrome ou Edge já habilita todo o
sistema, inclusive o acesso à pasta. Os recursos de PWA (instalação com ícone
próprio e cache offline via service worker) exigem servir os arquivos por HTTP(S) ou
`localhost` — o navegador não registra service worker a partir de `file://`. O
código reflete isso: o registro do service worker é condicionado a
`location.protocol.startsWith("http")`.

**O manifesto segue a mesma condição (desde a 1.6).** Sob `file://` o Chrome trata
cada arquivo como origem única, e a busca do `manifest.webmanifest` — uma requisição
em modo CORS — é sempre negada, com repetição, o que enchia o console de erros sem
consequência funcional. Por isso o `<link rel="manifest">` não é mais escrito no
`<head>`: ele é criado por código no fim do `index.html`, dentro do mesmo
`if (location.protocol.startsWith("http"))` que registra o service worker. Servido
por HTTP(S) o comportamento é idêntico ao anterior; por duplo clique, o link não
chega a existir.

**Formas de servir** (qualquer uma basta): `python -m http.server 8080`; `npx serve .`;
ou publicar a pasta em um servidor de arquivos da intranet. O próprio diretório de
rede pode hospedar o app (ex.: `unidadeCentral\app`).

**Dica de implantação:** mapear a pasta de rede como unidade de disco (ex.: `R:`)
torna a navegação no seletor de pastas bem mais simples para as pessoas.

**Atualização de versão:** ver 1.3 — as duas coisas que precisam concordar. A
versão atual é `1.10`, e o cache correspondente é `ra-1.10`. Na primeira carga após
atualizar, um recarregamento forçado (Ctrl+F5) ajuda a garantir a troca.

**Compatibilidade:** Chrome e Edge apenas, por decisão de projeto — a File System
Access API não está disponível em Firefox/Safari. Melhorias que ampliem o alcance
precisam de um caminho alternativo de persistência (ver seção 14). Quando a API não
existe, o aplicativo diz isso na tela em vez de falhar em silêncio.

**Verificação de mudanças.** Não há testes automatizados nem executor. Para conferir
uma alteração, abra `code/index.html` no Chrome e exercite-a; a pasta de rede pode
ser simulada com qualquer diretório local que tenha a estrutura
`<UNIDADE>/lancamentos/`. JS avulso pode ser checado com `node --check`. Ao mexer em
`sw.js` ou em arquivos cacheados, verifique com recarregamento forçado.

---

## 12. Limitações conhecidas

**De arquitetura**

- **Sincronização manual:** não há tempo real; a pessoa clica em "Atualizar dados da
  rede" para ver mudanças de terceiros.
- **Somente Chrome/Edge:** dependência da File System Access API.
- **Seleção da pasta por pessoa:** o *handle* não é transferível; cada usuário
  aponta a pasta uma vez por PC.
- **Segurança dependente de NTFS:** sem as permissões do sistema de arquivos, o
  controle é apenas contra uso casual.
- **Sem auditoria rica:** registra-se "aprovado por/em", mas não há trilha completa
  nem assinatura.

**De dados e cálculo**

- **O percentual mede intensidade, não assiduidade** (ver 7.3). É consequência
  assumida da regra, não defeito.
- **Carga horária autodeclarada:** o aplicativo não a confere contra o RH.
- **Complexidade fixada no catálogo:** não reflete o esforço real de cada ocorrência.
- **Dias corridos nas ausências:** não há tabela de feriados; a contagem exibida
  inclui fins de semana.
- **Gráficos não descontam ausências** nem normalizam por jornada (ver seção 8).
- **Lançamentos de abono anteriores à v11** continuam contando como atividade nos
  gráficos e indicadores.
- **Renomear pessoa desvincula dados:** mudar um nome no catálogo desliga a senha e o
  arquivo de lançamentos do nome antigo (o arquivo permanece; cabe ao adm limpar).

**De operação**

- **Escrita administrativa ampla:** a exclusão de registros por engano é possível; a
  confirmação reforçada mitiga, mas não impede.
- **Cache pegajoso:** publicar sem trocar a versão no `versao.js` faz o navegador
  continuar servindo a versão anterior.
- **Teto da data vale para o calendário, não para o teclado:** o `max` do campo
  cinza os dias futuros no seletor, mas quem digitar a data por cima do campo ainda
  grava em data futura. Decisão assumida, para não acrescentar mais uma recusa à
  tela; se o caso aparecer na prática, a correção é uma guarda no botão "Registrar".
- **Ausências oculta:** a seção está desligada por decisão de gestão (6.7). Enquanto
  isso, ninguém registra novos períodos, e o desconto na meta só alcança o que foi
  registrado antes.
- **Ajuda amarrada à versão:** corrigir um texto da tela de Ajuda exige publicar uma
  versão nova (ver 6.6). Dúvidas de rotina, que mudam toda semana, pertencem a um
  documento no repositório, não a esta tela.
- **Capturas envelhecem:** a v14 redesenhou as telas inteiras e teria invalidado
  todas de uma vez. Ao mexer numa tela retratada, refaça a captura na mesma hora.
- **Data de atualização manual:** a data exibida em "Sobre o programa" é digitada
  no `versao.js` ao publicar. Buscá-la do GitHub exigiria internet, que é
  justamente o que não se pode pressupor (ver 3.6).
- **`gerar-senha.html` não é cacheado** e, portanto, não abre offline.

---

## 13. Guia prático de modificação

Receitas para as alterações mais prováveis, com o ponto exato de intervenção.

| Quero… | Onde mexer |
|---|---|
| Adicionar/editar processos ou atividades | `catalogo.js` → `PROCESSOS`. Ajustar o campo `c` (complexidades válidas). |
| Mudar a pontuação de um nível | `catalogo.js` → `PONTOS`. Atenção: lançamentos antigos guardam o valor já calculado. |
| Mudar a meta diária de uma jornada | `catalogo.js` → `META_DIARIA`. Recalcula o percentual de todos os meses ao ser lido. |
| Acrescentar um tipo de ausência | `catalogo.js` → `TIPOS_AUSENCIA`. **Nunca troque um `k` já em uso** — só rótulos. |
| Adicionar unidade, chefia ou servidor | Em produção: painel do Administrador (grava no `config.json`). Semente: `catalogo.js` → `UNIDADES`. |
| Alterar o caminho exibido da pasta | `catalogo.js` → `PASTA_REDE`. |
| Mudar regra de quem aprova quem | `index.html` → `podeAprovar` e `aprovacaoDe`. Reveja também `quemAprova` (texto do recibo) e `hintPainel`. |
| Mudar quem alcança qual tela | `index.html` → `podeVer` **e** `ajustarRail`. Os dois: o rail esconde, a regra decide. |
| Acrescentar um campo ao lançamento | `index.html` → objeto `reg` no handler de `btnRegistrar`; leitura sempre defensiva (ver 4.6). |
| Guardar uma quarta coisa no arquivo da pessoa | `rede.js` → `gravarMeuArquivo` **e** `index.html` → `atualizarArquivoPessoa`. Nunca grave direto. |
| Acrescentar coluna ao CSV | `index.html` → `CAB_LANC` e `linhasCSVLancamentos` (vale para as duas telas que exportam). |
| Alterar tema visual | `index.html` → bloco `<style>`, `:root`. Lembre que verde = aprovado e dourado = pendente. |
| Restringir gráficos de novo à chefia geral | `index.html` → condição em `renderVis()`: tire `ehChefia()`. |
| Mudar o esquema de um JSON | `rede.js` (gravação) + `index.html` (leitura/uso). Mantenha compatibilidade retroativa. |
| Publicar uma versão nova | `code/versao.js` (número, etiqueta e data) **+** tag do repositório. Não escreva o número em nenhum outro lugar. |
| Ligar/desligar a seção Ausências | Painel do administrador → "Seções em avaliação". Em código: `mostraAusencias()` e `aplicarAusencias()` no `index.html`. |
| Mudar o texto da Ajuda | `index.html` → `<section id="vAjuda">`. Ao trocar uma captura, refaça a imagem em `code/ajuda/` e confira se ela está em `ARQUIVOS`, no `sw.js`. |
| Mudar o texto da janela "Sobre" | `index.html` → `<dialog id="dlgSobre">`; o que vem do `versao.js` é preenchido em `montarSobre()`. |

### 13.1. Convenções e cuidados

- **Sem build:** o código é servido como está. Não introduza transpilação, empacotador
  ou gerenciador de pacotes — parte do valor do projeto é a simplicidade de
  implantação.
- **Sem recurso remoto:** nenhuma fonte, biblioteca ou imagem buscada na internet. O
  cenário-alvo é uma máquina sem internet abrindo o app da pasta de rede.
- **Ordem de inicialização do estado global:** `ident`, `CFG`, `dirRaiz`,
  `situacaoPasta`, `dados` são globais e mutáveis. O defeito da v8 nasceu de ler
  estado antes de ele existir — teste sempre os fluxos de primeira execução (pasta
  virgem, sem identidade).
- **Compatibilidade de dados:** arquivos já gravados em produção não têm o campo novo
  que você adicionar. Use valores-padrão defensivos, como faz `papelDe`. **Nunca
  reescreva nem migre os arquivos que os usuários já têm na pasta.**
- **Preserve o escritor único:** ao criar uma funcionalidade que grava, pergunte quem
  é o dono do arquivo. Se dois perfis precisarem escrever no mesmo arquivo, repense o
  desenho (e prefira ler de dois lugares).
- **Escape tudo que vem de fora** antes de `innerHTML` (10.2).
- **Escreva em pt-BR:** interface, comentários, mensagens e documentação. A interface
  deve **explicar** a recusa, não falhar em silêncio.
- **Atualize o `LEIA-ME.txt`:** qualquer mudança de comportamento precisa de uma
  seção nova naquela voz — prosa simples, o *trade-off* declarado, a limitação
  admitida. O LEIA-ME é parte do que se entrega.
- **Acessibilidade primeiro pelo elemento nativo:** `<details>/<summary>`,
  `<dialog>`, `role`/`aria-*` nos widgets próprios, anel de foco sempre visível.
- **Teste multiperfil:** abra várias abas/janelas apontando para a mesma pasta local
  de teste e alterne entre servidor, chefia, chefia geral e adm.
- **Commits em pt-BR**, descrevendo a mudança visível para quem usa, não o código:
  `recusa gravar por cima de arquivo de lançamentos ilegível`. Uma branch por versão
  em andamento, mesclada por PR, e então a tag em `main`.

---

## 14. Roteiro de evolução sugerido

Melhorias ordenadas por relação custo/benefício, preservando a filosofia do projeto
quando possível.

### 14.1. Dentro da arquitetura atual (sem servidor)

- **Exportar no layout oficial (.xlsx):** gerar a planilha no formato que a chefia já
  conhece, além do CSV atual. Exigiria uma biblioteca embarcada (como o ECharts já
  é) — não um CDN.
- **Cache local dos dados da rede:** reduzir releituras mantendo um cache em
  IndexedDB com invalidação por `atualizadoEm`.
- **Verificação de identidade por escrita:** se o NTFS estiver configurado, provar a
  identidade pela capacidade de gravar no próprio arquivo (aproveitando o login de
  rede), reduzindo a dependência de senhas.
- **Trilha de auditoria:** registrar em um log *append-only* **por autor** (para não
  violar o escritor único) as ações de aprovação e exclusão, com carimbo de tempo.
- **Bloqueio otimista:** usar `atualizadoEm` para detectar sobrescrita entre abas do
  mesmo usuário.
- **Tabela de feriados opcional:** permitiria contar dias úteis nas ausências e
  refinar as leituras gerenciais. Note que isso **não** mudaria o percentual da meta,
  que já ignora dias sem lançamento.
- **Descontar ausências e jornada nos gráficos:** hoje a nota abaixo do gráfico
  admite que não são descontadas. Fazer isso permitiria uma leitura de carga
  comparável entre pessoas — mas exige decidir e documentar a fórmula com o mesmo
  cuidado que a meta recebeu.

### 14.2. Mudança de arquitetura (com *backend*)

Se os requisitos evoluírem para identidade verificada, auditoria robusta, acesso
remoto e concorrência real, a resposta correta passa a ser um *backend* mínimo (ou
uma plataforma institucional já existente). O ponto positivo do desenho atual é que
o formulário e o modelo de dados permanecem — muda apenas a camada de persistência
(substituir `rede.js` por chamadas a uma API REST, mantendo os mesmos esquemas
JSON). A separação já existente entre a camada de rede e a lógica de interface
facilita essa transição.

O que **não** sobreviveria a essa migração sem revisão: o selo de instalação (deixa
de fazer sentido), a estratégia *cache-first* do service worker (viraria
*network-first* para dados) e o princípio do escritor único (substituído por
transações no servidor).

---

## 15. Glossário

| Termo | Significado no projeto |
|---|---|
| PWA | *Progressive Web App*: site que pode ser instalado e usado offline. |
| File System Access API | API do navegador que permite ler/gravar arquivos locais ou de rede com permissão do usuário. |
| *Handle* | Referência a uma pasta/arquivo concedida pelo navegador; intransferível entre máquinas. |
| Selo de instalação | UUID gravado no `config.json` que identifica a pasta oficial (v7+). |
| Escritor único | Princípio de que cada arquivo tem um só autor gravando, evitando concorrência destrutiva. |
| Ponto único de escrita | `atualizarArquivoPessoa()`: a única função que grava o arquivo de uma pessoa, preservando registros, carga e ausências. |
| Papel | Função da pessoa (`servidor`/`chefia`/`geral`/`adm`) que determina permissões e cadeia de aprovação. |
| Complexidade | Nível (baixa/média/alta) que define a pontuação de uma atividade (5/10/15). |
| Carga horária | Jornada diária autodeclarada (8h ou 6h), de onde sai a meta diária. |
| Meta diária | Pontos esperados por dia trabalhado: 15 para 8h, 11 para 6h (`META_DIARIA`). |
| Meta alcançada | Percentual medido só nos dias com lançamento, descontando ausências (seção 7). |
| Ausência | Período de afastamento, em dias corridos, sem pontos e sem aprovação. |
| Semente | Dados iniciais em `catalogo.js` copiados para o `config.json` na primeira oficialização. |
| *Rail* | Barra de navegação escura à esquerda (v14), que vira barra horizontal em tela estreita. |
| Tag | Marca do Git que identifica uma versão publicada (`v1.5`); substituiu as pastas por versão do beta. |
| `versao.js` | O único arquivo onde a versão do aplicativo é escrita; dele derivam a etiqueta do rail, a janela "Sobre" e a chave do cache offline. |

---

# Anexo — O que é uma *Progressive Web App*

*(o anexo do relatório v8, mantido como material de referência; o exemplo aplicado
foi reescrito para este projeto)*

Uma *Progressive Web App* (PWA) é uma aplicação desenvolvida com tecnologias da
Web — HTML, CSS e JavaScript — mas preparada para oferecer características
normalmente associadas a aplicativos instalados:

- ícone na tela inicial ou no menu do sistema;
- abertura em uma janela própria;
- funcionamento parcial ou completo sem internet;
- carregamento mais rápido por meio de cache;
- notificações;
- execução de algumas tarefas em segundo plano;
- acesso por URL, como qualquer site.

Uma PWA não é uma nova linguagem nem um framework. É uma forma de projetar e
configurar uma aplicação web para que ela se comporte de maneira mais próxima de um
aplicativo nativo. *(MDN Web Docs)*

## A ideia central

| Aplicação web tradicional | Aplicativo nativo |
|---|---|
| Acessada por uma URL | Instalado no dispositivo |
| Atualizada diretamente no servidor | Possui ícone próprio |
| Funciona em diferentes sistemas | Integra-se ao sistema operacional |
| Não exige loja de aplicativos | Pode operar offline |
| Normalmente depende da conexão | Pode executar tarefas em segundo plano |

A PWA tenta oferecer parte das vantagens das duas: **é um site que pode adquirir
comportamento de aplicativo**. Uma única base de código pode atender computadores,
celulares e tablets, embora os recursos disponíveis variem conforme o navegador e o
sistema operacional. *(MDN Web Docs)*

## Por que o termo "progressive"?

"Progressive" refere-se ao princípio do **aprimoramento progressivo**: a aplicação
deve possuir funcionalidade básica acessível como site e, quando o navegador
oferecer recursos adicionais, passar a utilizá-los.

1. em um navegador básico, funciona como um site;
2. em um navegador compatível, pode ser instalada;
3. com *Service Worker*, pode oferecer conteúdo offline;
4. quando permitido, pode enviar notificações;
5. em sistemas compatíveis, pode integrar-se a arquivos, atalhos e compartilhamento.

Assim, a aplicação não deveria deixar de funcionar simplesmente porque determinado
recurso de PWA não está disponível. *(MDN Web Docs)*

## Os componentes principais

### 1. Aplicação web normal

A base continua sendo uma aplicação web comum. No caso típico:

```
HTML + CSS + JavaScript
        ↓
Backend PHP, Python, Java, Node etc.
        ↓
Banco de dados
```

Tanto arquiteturas SPA quanto MPA podem ser utilizadas. *(web.dev)*

### 2. Web App Manifest

Arquivo JSON que descreve como a aplicação deve aparecer quando instalada — nome,
ícones, página inicial, cor da interface, orientação, forma de exibição e atalhos. É
conectado à página com:

```html
<link rel="manifest" href="manifest.webmanifest">
```

O manifesto não contém a aplicação; contém metadados para instalação e integração
com o sistema operacional. *(web.dev)*

### 3. Service Worker

Script JavaScript executado separadamente da página, que fica entre a aplicação e a
rede e pode interceptar as solicitações:

```
Aplicação
    ↓
Service Worker
   ↙      ↘
Cache   Servidor
```

Quando a aplicação solicita um arquivo, o Service Worker pode buscar no servidor,
devolver a versão em cache, usar o cache e atualizar depois, tentar a rede e cair
para o cache, ou apresentar uma página offline. *(web.dev)*

### 4. HTTPS

Service Workers só são disponibilizados em contextos seguros — HTTPS, com
`localhost` tratado como exceção para desenvolvimento. Isso importa porque o Service
Worker pode interceptar comunicações e controlar recursos armazenados localmente.
*(MDN Web Docs)*

### 5. Interface responsiva

Como uma PWA pode ser usada em celular, tablet ou computador, a interface precisa
adaptar-se aos tamanhos de tela. Mas **um site responsivo não é automaticamente uma
PWA**: responsividade é característica de interface; PWA envolve também instalação,
manifesto, cache, Service Workers e integração com a plataforma.

## Estratégias de cache

| Estratégia | Como funciona | Adequada para |
|---|---|---|
| *Cache first* | Consulta o cache; se não achar, vai ao servidor | Ícones, imagens estáticas, fontes, CSS, bibliotecas |
| *Network first* | Consulta o servidor; se falhar, usa o cache | Dados que precisam estar atualizados |
| *Stale while revalidate* | Mostra o cache e busca atualização em paralelo | Conteúdos cuja pequena defasagem seja aceitável |

## Como isso se aplica a este projeto

O Programa de Resultados é um caso incomum de PWA, e vale explicitar por quê:

- **Não há backend nem banco.** A camada que normalmente ficaria no servidor —
  autenticação, permissões, consulta de dados — está no navegador e na pasta de rede.
  O diagrama de três camadas do exemplo genérico se reduz a duas: navegador e
  sistema de arquivos.
- **A estratégia é *cache-first* para tudo**, e não só para os estáticos. Isso é
  possível porque o cache guarda apenas o **aplicativo** (HTML, CSS, JS, ícones,
  ECharts); os **dados** nunca passam pelo Service Worker — chegam pela File System
  Access API, direto da pasta de rede. Não há requisição de dados a interceptar, e
  por isso não há risco de o cache servir dado velho.
- **O offline é real, não parcial.** Como a "fonte de verdade" é uma pasta de rede
  (não a internet), o aplicativo funciona integralmente numa máquina sem internet,
  desde que ela alcance a pasta.
- **A atualização é manual e explícita:** trocar a `versao` no `versao.js`, de onde
  o `sw.js` deriva a chave do cache. É o preço de não ter servidor decidindo por
  nós, e é por isso que a regra das "duas coisas que precisam concordar" (1.3)
  existe.
- **HTTPS só é necessário para instalar.** Abrir o `index.html` por `file://`
  continua dando acesso completo à pasta e a todas as funcionalidades; o que se perde
  é o ícone instalado e o cache offline.

## Síntese

> Uma PWA é uma aplicação web que continua acessível como site, mas recebe
> progressivamente recursos de instalação, cache, operação offline e integração com o
> dispositivo.

```
Aplicação web existente
        +
Design responsivo
        +
HTTPS
        +
Web App Manifest
        +
Service Worker
        +
Estratégia de cache e atualização
        =
Progressive Web App
```

---

*Programa de Resultados — COBIB · Relatório Técnico da versão 1.10 (ago/2026).
Documento vivo: ao publicar uma versão nova, atualize as seções afetadas e o
histórico de versões (1.2).*
