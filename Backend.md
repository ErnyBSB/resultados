# Programa de Resultados — COBIB
## Vale a pena acrescentar um banco de dados?
### Estudo de decisão · escrito sobre a versão 1.15
#### Válido para a 1.16, que mudou documentação e o carimbo da versão, nada mais

> Documento de decisão, para quando a ideia de "botar isso num servidor com um banco"
> voltar à mesa — e ela volta. Responde a quatro perguntas: **o que exatamente estaria
> sendo acrescentado?**, **o que se ganha com isso?**, **o que se perde?** e, se for para
> fazer, **por qual banco começar?**
>
> A conclusão está na seção 7, e o caminho recomendado não é nenhum dos dois extremos.
>
> Companheiro de [`Hospedagem.md`](Hospedagem.md), que trata de servir o aplicativo como
> ele é hoje. Este trata de mudá-lo. Os dois assuntos costumam ser confundidos numa
> conversa só, e não são o mesmo: hospedar não exige banco nenhum.

---

## 1. A pergunta está mal formulada, e isso importa

Não existe "acrescentar um banco de dados" a este aplicativo. **Nenhuma página de
navegador abre conexão com PostgreSQL** — não há cliente Postgres em JavaScript de
navegador, e não haveria como haver: exporia a credencial do banco a qualquer pessoa que
abrisse o F12.

Com SQLite a resposta é a mesma por outro caminho: um banco SQLite é um arquivo, e a File
System Access API entrega **bytes**, não um mecanismo de banco de dados — não há no
navegador quem execute o SQLite sobre esses bytes. Seja qual for o banco, alguém precisa
executá-lo, e esse alguém é um servidor.

O que a ideia realmente contém é:

| O que se pede | O que vem junto, obrigatoriamente |
|---|---|
| Um banco de dados | Um **servidor de aplicação** com uma API entre o navegador e o banco |
| | Um mecanismo de **autenticação** de verdade (sessão, token ou SSO) |
| | Um **runtime** para hospedar isso (Node, Python, PHP…) e um jeito de publicá-lo |
| | **Backup testado** do banco — não do arquivo, do banco |
| | **Alguém que opere tudo isso**, para sempre |

A decisão, portanto, não é *arquivo* contra *tabela*. É **"nenhum servidor" contra "um
servidor que a unidade passa a operar"**. Tudo o mais decorre disso — inclusive a escolha
do banco, que é secundária: a primeira linha da tabela é a única que o SQLite dispensa
(seção 5.2), e as outras continuam valendo com qualquer banco.

> Esta mudança contraria o **objetivo 1** do `CLAUDE.md` — "zero infraestrutura: sem
> backend, sem banco de dados". É uma regra do próprio projeto, e pode ser revogada por
> quem a escreveu; o que ela não pode é ser contornada por distração. Daí este documento.

---

## 2. A escala nunca vai justificar

Antes de discutir vantagens, convém tirar da mesa o argumento que **não** existe: o de
volume.

Medindo o esquema real de um lançamento (`id`, `data`, `unidade`, `servidor`, `papel`,
`processo`, `atividade`, `complexidade`, `pontos`, `cargaHoraria`, `obs`) contra as 72
atividades do catálogo:

| Medida | Valor |
|---|---|
| Um lançamento em JSON | 328–488 bytes, média **402** |
| 50 pessoas × 20 lançamentos/mês | 12.000 linhas/ano — **4,6 MiB/ano** |
| 50 pessoas × 40 lançamentos/mês | 24.000 linhas/ano — **9,2 MiB/ano** |
| Dez anos, no cenário maior | **92 MiB** em JSON; ~230 MiB em banco, com índices (a ordem de grandeza é a mesma em SQLite e em Postgres) |

Dez anos de COBIB inteira cabem na memória de qualquer servidor, várias vezes. O banco
ficaria **permanentemente ocioso**.

Isso tem uma consequência prática: **nenhuma vantagem listada adiante vem de desempenho
ou de capacidade.** Todas vêm de *capacidade funcional* — de coisas que o modelo de
arquivos não consegue fazer, e não de coisas que ele faz devagar. Quem defender a
mudança por "o volume vai crescer" está defendendo pelo motivo errado.

---

## 3. O que um backend genuinamente resolve

Nenhum item aqui é especulação: **todos são limitações já admitidas na seção 12 do
`Projeto_Design.md`.** O banco não é uma ideia nova — é a resposta às coisas que já
estão escritas como problema.

| Limitação documentada | O que o backend faz com ela |
|---|---|
| **Somente Chrome/Edge** | **Desaparece.** Firefox, Safari, celular, tablet. A restrição de navegador existe *só* por causa da File System Access API — nada mais no aplicativo depende dela. É a maior vantagem isolada. |
| **Segurança dependente de NTFS** | Sessão de verdade e, melhor ainda, o diretório corporativo (AD/LDAP/SSO). Hoje a senha é `sha256("nome\|senha")` num arquivo JSON, e o próprio LEIA-ME admite: quem consegue apagar aquela linha vira administrador. |
| **Sem auditoria rica** | Trilha *append-only* é trivial com transações e desconfortável com arquivos. |
| **Sincronização manual** | Some o botão "Atualizar dados da rede": o dado chega quando muda. |
| **Renomear pessoa desvincula dados** | Some. A identidade vira chave, e não nome de arquivo. |
| **Seleção da pasta por pessoa** | Some. Sem *handle*, sem configurar máquina por máquina, sem pedido de permissão. |
| **Gráficos não descontam ausências / sem tabela de feriados** | Vira SQL comum, em vez de exigir ler o arquivo de cada pessoa e cruzar em memória. |

### 3.1. O ganho que não está na lista de limitações

O princípio do **escritor único** não apenas evita conflito: ele **dita o modelo de
dados**. Foi ele que mandou os horários (v1.14) para dentro do arquivo de cada pessoa, em
vez de uma escala que a chefia edita — decisão registrada na seção 7.5 do
`Projeto_Design.md`, junto com a alternativa que foi descartada por violá-lo.

Com transações no servidor, essa restrição para de moldar o desenho. Passa a ser possível
o que hoje é impossível por construção: a chefia montar a escala, dois papéis editarem o
mesmo registro, um fluxo de aprovação com mais de um passo.

### 3.2. A migração é mais barata do que parece

A seção 14.2 do `Projeto_Design.md` já registra por quê, e continua valendo: **o
`rede.js` é uma costura limpa.** A interface e o modelo de dados permanecem; troca-se a
camada de persistência por chamadas a uma API, e os mesmos esquemas JSON viram o corpo
das requisições.

O que **não** sobrevive sem revisão: o selo de instalação (perde o sentido), a estratégia
*cache-first* do service worker (vira *network-first* para dados) e o próprio escritor
único (substituído por transações).

---

## 4. O que se perde

### 4.1. O objetivo que sustenta o projeto

"Zero infraestrutura" não é preciosismo: é o motivo de este programa existir e continuar
funcionando numa unidade sem equipe de operação. Hoje, o pior desastre possível é
alguém apagar uma pasta — e a pasta está no backup do servidor de arquivos da casa, como
qualquer outra.

Com um backend, a lista de coisas que precisam de manutenção contínua passa a incluir:
atualização de segurança do sistema operacional e do banco, **restauração de backup
testada** (backup não testado não é backup), renovação de certificado, e alguém de
sobreaviso quando cair às 9h de uma segunda-feira.

Essa lista encolhe bastante — mas não desaparece — se o banco for SQLite: some o serviço
a instalar, autenticar, ajustar e atualizar, e o backup vira a cópia de um arquivo. Ver
5.2. O que **não** encolhe é o resto: continua havendo um serviço no ar, um certificado
a renovar e alguém a ser chamado.

> **Antes de decidir, dê nome a essa pessoa.** Se a resposta for "a mesma pessoa que
> escreveu o aplicativo", o que se está criando é um ponto único de falha com cargo. Esse
> é o risco central desta mudança — não o técnico.

### 4.2. O offline deixa de ser de graça

Hoje o funcionamento sem internet é consequência do desenho: os arquivos são locais e o
service worker serve primeiro o cache. Com dados vindos de uma API, offline vira
funcionalidade a construir — fila de escrita local, resolução de conflito, reconciliação
—, e cada uma dessas palavras é trabalho e defeito em potencial.

### 4.3. A migração é de uma via só

O objetivo 3 do `CLAUDE.md` proíbe reescrever arquivo que já esteja na pasta da rede.
Uma importação única para o banco não fere isso — os arquivos ficam onde estão, intactos
—, mas o **corte** precisa de cuidado: a partir do momento em que o banco passa a
mandar, os arquivos param de ser a verdade, e voltar atrás significa perder o que foi
lançado depois do corte.

### 4.4. Se "remoto" for fora da rede corporativa

Aí não é mais decisão técnica. Dado de desempenho de pessoa identificada saindo da
intranet é assunto institucional e de LGPD, e precisa de resposta **antes** de qualquer
dimensionamento. Este documento não a tem.

---

## 5. SQLite: onde é armadilha e onde é a melhor escolha

"SQLite" nomeia duas propostas opostas, e confundi-las custa caro nos dois sentidos —
uma delas é perigosa, a outra é provavelmente o melhor primeiro passo que este projeto
tem. O que separa as duas não é o banco: é **onde o arquivo mora e quantos processos
escrevem nele**.

### 5.1. Na pasta da rede: não faça

É a primeira ideia que ocorre a quem quer "banco sem servidor", e é a única opção
genuinamente perigosa deste documento.

SQLite sobre SMB/CIFS tem problemas conhecidos de travamento (*locking*) e **risco real
de corrupção** com escritores concorrentes — é o próprio projeto SQLite quem desaconselha
o uso sobre sistemas de arquivos em rede, porque o travamento depende de garantias que o
compartilhamento não dá de forma confiável. Um único arquivo de banco na pasta
compartilhada teria exatamente os múltiplos escritores que o desenho atual proíbe por
construção, com um agravante: hoje, um arquivo JSON corrompido derruba **uma** pessoa e é
recuperável à mão; um `.sqlite` corrompido derruba **todo mundo** de uma vez.

Seria trocar a garantia mais forte do sistema por uma aparência de sofisticação.

E há um impedimento anterior, que encerra o assunto: **o navegador não abriria esse
arquivo de qualquer modo.** A File System Access API entrega bytes, não um mecanismo de
banco de dados. Sem servidor, não há quem execute o SQLite.

### 5.2. No servidor, um processo só: é a escolha certa

Aqui a conclusão se inverte, e por um motivo que está na seção 2: **a escala deste
sistema é minúscula.** As restrições que costumam mandar alguém para o PostgreSQL —
escrita concorrente pesada, muitas conexões, replicação — não se aplicam a cinquenta
pessoas lançando algumas linhas por dia.

| O que costuma decidir por Postgres | Como fica aqui |
|---|---|
| Escrita concorrente alta | Algumas dezenas de gravações **por dia**. Em modo WAL, o SQLite aceita leitores simultâneos e um escritor por vez, e cada transação dura milissegundos. |
| Volume | 92 MiB em dez anos (seção 2). O SQLite trabalha confortavelmente com bases centenas de vezes maiores. |
| Vários servidores de aplicação | Um só, e nem isso é certo. |
| Replicação e alta disponibilidade | Não são requisito — hoje o sistema depende de uma pasta compartilhada. |

O ganho decisivo é **operacional**, e vai direto contra a objeção mais forte deste
documento, a da seção 4.1: com SQLite não há serviço de banco para instalar, subir,
autenticar, tunar nem atualizar. O banco é **um arquivo ao lado da aplicação**. A pessoa
que a seção 4.1 manda nomear continua sendo necessária — mas o que ela precisa saber
encolhe de "operar um SGBD" para "cuidar de um serviço e copiar um arquivo".

**Backup fica de uma linha:** `VACUUM INTO '/backup/resultados-2026-09-08.db'` produz uma
cópia íntegra com o banco em uso. Sem `pg_dump`, sem papel de administrador de banco, sem
janela de manutenção. (Continua valendo a regra da seção 4.1: backup que nunca foi
restaurado não é backup.)

**E não fecha a porta.** O esquema da seção 6.2 é quase idêntico nos dois bancos, e migrar
para PostgreSQL depois — se e quando alguma restrição real aparecer — é exportar e
importar, não reescrever o sistema.

### 5.3. O que se aceita ao escolher SQLite

Para que a decisão seja tomada com os olhos abertos:

- **O banco não atende pela rede.** Não existe "conectar no SQLite" de outra máquina: ele
  vive no mesmo host da aplicação, e quem fala com o mundo é a API. Para este caso isso é
  simplificação, não limitação.
- **Autorização é toda da aplicação.** O SQLite não tem usuários nem papéis próprios. O
  PostgreSQL tem — e aqui não faria diferença, porque quem decide o que cada papel pode
  ver já é o código, não o banco.
- **Um escritor por vez.** Com WAL isso quase nunca aparece; num pico improvável, uma
  gravação espera alguns milissegundos. Se um dia o sistema virar escrita pesada — o que
  a seção 2 diz ser implausível —, é o sinal de migrar.
- **Tipos são dinâmicos.** O SQLite aceita texto numa coluna `smallint` sem reclamar
  (salvo `STRICT`). O rigor tem de estar na rotina que grava, e é bom lembrar que hoje
  ele nem existe: os arquivos JSON não têm tipo nenhum.

---

## 6. O caminho recomendado: banco só de leitura, primeiro

Existe um meio-termo que entrega a maior parte do valor com risco praticamente nulo, e é
por ele que se deve começar.

**Um banco alimentado a partir dos arquivos JSON, apenas para leitura e relatório.** Uma
rotina agendada varre a pasta da rede e carrega o banco. Ninguém muda o caminho de
escrita: o escritor único continua valendo, o offline continua valendo, os arquivos das
pessoas continuam sendo a verdade, e o aplicativo não muda uma linha.

**Use SQLite aqui**, pelas razões da seção 5.2 e por mais uma que só vale neste caso: o
banco é **descartável**. Ele é derivado, não é fonte — some, e uma nova varredura o
refaz. Um arquivo derivado e recriável é exatamente o que não merece um serviço de banco
de dados instalado, com porta, usuário e atualização de segurança.

Repare que a advertência da seção 5.1 não se aplica: quem grava é **um único processo**,
a rotina de carga, rodando num host só. Se o arquivo do banco ficar nesse mesmo host — e
não na pasta compartilhada —, não há escritor concorrente nenhum.

### 6.1. Por que este é o primeiro passo certo

- **Risco zero para o dado.** A carga só lê. Se o banco sumir, recria-se do zero varrendo
  a pasta de novo.
- **Entrega o que hoje mais aperta.** As últimas versões foram todas sobre *leitura
  gerencial* — relatório impresso (1.13), filtro por papel (1.12), mapa de cobertura
  (1.14). Todas hoje precisam ler o arquivo de cada pessoa e cruzar em memória, no
  navegador. Em SQL isso é uma consulta.
- **Destrava a normalização adiada.** O item "descontar ausências e jornada nos gráficos"
  (seção 14.1) está parado há versões porque exige cruzar tudo com tudo. Com SQL, deixa
  de ser difícil.
- **Prova o valor antes da aposta.** Se em seis meses ninguém consultar o banco, a
  resposta sobre o backend completo já está dada — e não custou o sistema.
- **O esquema já fica pronto.** Se depois se decidir pelo backend, a modelagem foi feita
  e testada com dado de verdade.
- **Custa quase nada para tentar.** Com SQLite, o experimento inteiro é uma rotina de
  carga e um arquivo. Se não servir, apaga-se o arquivo e não sobrou nada para
  desinstalar.

### 6.2. Esboço do esquema

Tirado dos esquemas reais (`Projeto_Design.md` seções 3.3 e 7.5). Os identificadores
originais são preservados como chave, para que a carga seja idempotente — rodar duas
vezes não duplica nada.

Escrito em PostgreSQL por ser o dialeto mais explícito; logo abaixo, o que muda para
rodar em SQLite, que é o banco recomendado para este passo.

```sql
-- Pessoas: derivadas do config.json da pasta central.
CREATE TABLE pessoa (
  nome      text PRIMARY KEY,          -- é a chave hoje; ver a limitação de renomear
  unidade   text NOT NULL,
  papel     text NOT NULL              -- servidor | chefia | geral | adm
);

CREATE TABLE lancamento (
  id            text PRIMARY KEY,      -- "1757000000000-x3k9a", como já é gravado
  data          date NOT NULL,
  unidade       text NOT NULL,
  servidor      text NOT NULL REFERENCES pessoa,
  papel         text NOT NULL,         -- papel NO MOMENTO do lançamento
  processo      text NOT NULL,
  atividade     text NOT NULL,
  complexidade  char(1) NOT NULL,      -- b | m | a
  pontos        smallint NOT NULL,     -- 5 | 10 | 15
  carga_horaria smallint,              -- 8 | 6 | NULL em lançamentos pré-v11
  obs           text
);
CREATE INDEX ON lancamento (data);
CREATE INDEX ON lancamento (servidor, data);

-- A aprovação pode estar em DOIS arquivos (unidade ou GERAL). A coluna
-- "origem" preserva essa distinção, que decide quem pode desfazê-la.
CREATE TABLE aprovacao (
  lancamento_id text PRIMARY KEY REFERENCES lancamento,
  por           text NOT NULL,
  em            timestamptz NOT NULL,
  origem        text NOT NULL          -- 'unidade' | 'geral'
);

CREATE TABLE ausencia (
  id       text PRIMARY KEY,           -- "aus-..."
  unidade  text NOT NULL,
  servidor text NOT NULL REFERENCES pessoa,
  papel    text NOT NULL,
  tipo     text NOT NULL,              -- chave "k" de TIPOS_AUSENCIA
  de       date NOT NULL,
  ate      date NOT NULL,
  obs      text
);

CREATE TABLE horario (                 -- v1.14
  id       text PRIMARY KEY,           -- "hor-..."
  unidade  text NOT NULL,
  servidor text NOT NULL REFERENCES pessoa,
  papel    text NOT NULL,
  carga    smallint,                   -- jornada no momento da declaração
  de       date NOT NULL,
  ate      date NOT NULL,
  dias     smallint[] NOT NULL,        -- 0 = domingo, como getUTCDay()
  inicio   time NOT NULL,
  fim      time NOT NULL,
  obs      text
);

-- Quando a carga foi lida da pasta, para que um relatório saiba se está
-- olhando dado de hoje ou de ontem.
CREATE TABLE carga_execucao (
  em        timestamptz PRIMARY KEY DEFAULT now(),
  arquivos  integer NOT NULL,
  erros     integer NOT NULL
);
```

**Uma regra para a rotina de carga:** ela lê a pasta e **nunca grava nela**. Se um arquivo
estiver ilegível, conta como erro em `carga_execucao` e segue — a mesma postura que o
`lerArquivoParaGravar()` já adota no aplicativo, e pelo mesmo motivo: recusar-se a
adivinhar é melhor do que gravar por cima.

**O mesmo esquema em SQLite.** Três diferenças, e só uma delas exige decisão:

| Em PostgreSQL | Em SQLite | Comentário |
|---|---|---|
| `timestamptz` | `text` | ISO-8601 em UTC, que é como o `atualizadoEm` e o `em` das aprovações já são gravados hoje. |
| `char(1)`, `smallint`, `date`, `time` | `text` / `integer` | Tipos são dinâmicos; declare assim mesmo, pela documentação, ou use `STRICT`. |
| `dias smallint[]` | `dias text` | **A única decisão real.** Guarde o JSON como veio (`'[1,2,3,4,5]'`) e consulte com `json_each`, que o SQLite traz de fábrica. |

Acrescente `PRAGMA journal_mode = WAL;` uma vez, na criação: é o que deixa relatórios
lerem enquanto a rotina de carga grava.

### 6.3. O que isso muda, em uma consulta

Vale ver de perto, porque é o argumento inteiro em cinco linhas. O **mapa de cobertura**
da v1.14 — quantas pessoas disponíveis em cada dia da semana — hoje exige ler o arquivo
JSON de cada pessoa, expandir os períodos dia a dia e cruzar com as ausências, tudo em
memória, no navegador de quem abre o painel. Em SQL:

```sql
SELECT j.value AS dia, count(*) AS pessoas
  FROM horario h, json_each(h.dias) j
 GROUP BY j.value
 ORDER BY j.value;
```

E as horas semanais por pessoa, que hoje alimentam a barra ao lado do mapa:

```sql
SELECT servidor,
       (julianday('2000-01-01 ' || fim) - julianday('2000-01-01 ' || inicio))
       * 24 * json_array_length(dias) AS horas_semana
  FROM horario;
```

Conferido num SQLite 3.45 com os dados do elenco de exemplo: as consultas devolvem 30h
para Ana Beatriz Nunes e 24h para Carlos Eduardo Prado, e segunda-feira coberta por duas
pessoas — os mesmos números que a aba *Horários* calcula hoje em JavaScript. O `json_each`
e o `json_array_length` vêm de fábrica no SQLite; não é extensão a instalar.

**O que essa consulta ainda não faz** é descontar ausências, que é justamente o item
adiado na seção 14.1 do `Projeto_Design.md`. A diferença é que, aqui, ele passa a ser um
`LEFT JOIN` — e não uma reescrita da leitura inteira.

### 6.4. Dimensionamento dos três caminhos

| | **A.** Só leitura, SQLite | **B.** Backend com SQLite | **C.** Backend com Postgres |
|---|---|---|---|
| vCPU | 1 | 2 | 2–4 |
| RAM | 1 GB | 2 GB | 4–8 GB |
| Disco | 20 GB | 40 GB | 80 GB (dado + WAL + backup) |
| Componentes | Rotina de carga + um arquivo `.db` | API + runtime + um arquivo `.db` | Postgres + API + runtime + sessão/SSO |
| Serviço de banco a operar | **Nenhum** | **Nenhum** | Um, com atualização e ajuste |
| Backup | Copiar o arquivo (ou nem isso: recria-se da pasta) | `VACUUM INTO`, uma linha | `pg_dump` + política + teste de restauração |
| Acesso à pasta da rede | **Sim** — a rotina lê a pasta | Não, depois do corte | Não, depois do corte |
| Se cair | Relatórios desatualizam; **o aplicativo continua funcionando** | **O aplicativo para** | **O aplicativo para** |

Duas linhas concentram a decisão.

A de **"se cair"** separa A de B e C: no caminho A o banco é acessório de leitura, e cair
não impede ninguém de lançar; em B e C o banco **é** o sistema.

A de **"serviço de banco a operar"** separa C dos outros dois, e é a que costuma ser
subestimada. A seção 4.1 pede que se dê nome a quem vai operar a coisa; em A e B essa
pessoa cuida de um serviço e de um arquivo, em C ela cuida também de um SGBD. Para o
volume da seção 2, **C não compra nada com essa diferença** — compra apenas a
possibilidade de crescer para além do que este sistema tem qualquer perspectiva de ser.

---

## 7. Recomendação

**Não acrescente banco de dados a esta versão.** Acrescente-o ao lado, só para leitura,
como descrito na seção 6, e deixe o caminho de escrita como está.

**E quando for a hora de acrescentar, comece por SQLite, não por PostgreSQL.** A escolha
do banco não é a decisão importante deste documento — a decisão importante é assumir um
servidor —, e o SQLite deixa essa primeira tentativa reversível: um arquivo, nenhum
serviço, e migração para o Postgres disponível se algum dia uma restrição real aparecer.
Começar pelo Postgres é pagar adiantado por uma escala que a seção 2 mostra que não vem.

Em ordem, então:

| Passo | O que é | Quando |
|---|---|---|
| **0** | O modelo de arquivos, como está | Hoje. Não há requisito escrito que ele não atenda. |
| **A** | SQLite só de leitura, alimentado pelos arquivos | Quando relatório gerencial passar a doer — provavelmente o próximo passo real. |
| **B** | Backend com SQLite | Quando alguma das cinco condições abaixo virar requisito. |
| **C** | Trocar para PostgreSQL | Só se B esbarrar em limite concreto: escrita concorrente pesada, mais de um servidor de aplicação, ou exigência da corporação. Não antes. |

**Passe ao backend (passo B) quando — e só quando — alguma destas deixar de ser desejo e
virar requisito:**

1. Acesso de fora do Chrome/Edge, ou de celular.
2. Identidade verificada contra o diretório corporativo.
3. Trilha de auditoria de verdade.
4. Registros compartilhados que **dois papéis** precisem editar (escala montada pela
   chefia, aprovação em mais de um passo).
5. Acesso remoto, fora da rede interna — com a questão de LGPD da seção 4.4 já
   respondida.

Enquanto nenhuma dessas for requisito escrito, o modelo de arquivos está fazendo o
trabalho dele: cinco versões publicadas em um dia, sem migração, sem janela de
manutenção e sem ninguém de sobreaviso.

---

*Programa de Resultados — COBIB · Estudo de decisão escrito sobre a versão 1.15
(set/2026). As cifras de volume foram medidas contra o catálogo e o esquema reais; o
dimensionamento da seção 6.4 é estimativa, e as consultas da seção 6.3 foram executadas num
SQLite 3.45 com dados de exemplo, mas a rotina de carga não existe e nada foi rodado
contra a pasta de rede real nem contra uma instalação de PostgreSQL.*
