# Programa de Resultados — COBIB
## Vale a pena acrescentar um banco de dados?
### Estudo de decisão · escrito sobre a versão 1.15

> Documento de decisão, para quando a ideia de "botar isso num servidor com um banco"
> voltar à mesa — e ela volta. Responde a três perguntas: **o que exatamente estaria
> sendo acrescentado?**, **o que se ganha com isso?** e **o que se perde?**
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

O que a ideia realmente contém é:

| O que se pede | O que vem junto, obrigatoriamente |
|---|---|
| Um banco de dados | Um **servidor de aplicação** com uma API entre o navegador e o banco |
| | Um mecanismo de **autenticação** de verdade (sessão, token ou SSO) |
| | Um **runtime** para hospedar isso (Node, Python, PHP…) e um jeito de publicá-lo |
| | **Backup testado** do banco — não do arquivo, do banco |
| | **Alguém que opere tudo isso**, para sempre |

A decisão, portanto, não é *arquivo* contra *tabela*. É **"nenhum servidor" contra "um
servidor que a unidade passa a operar"**. Tudo o mais decorre disso.

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
| Dez anos, no cenário maior | **92 MiB** em JSON; ~230 MiB em Postgres com índices |

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
atualização de segurança do sistema operacional e do Postgres, **restauração de backup
testada** (backup não testado não é backup), renovação de certificado, e alguém de
sobreaviso quando cair às 9h de uma segunda-feira.

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

## 5. A armadilha: SQLite na pasta da rede

Vale registrar porque é a primeira ideia que ocorre a quem quer "banco sem servidor", e
é a única opção genuinamente perigosa deste documento.

**Não faça.** SQLite sobre SMB/CIFS tem problemas conhecidos de travamento (*locking*) e
**risco real de corrupção** com escritores concorrentes — é o próprio projeto SQLite quem
desaconselha o uso sobre sistemas de arquivos em rede. Um único arquivo de banco na pasta
compartilhada teria exatamente os múltiplos escritores que o desenho atual proíbe por
construção, com um agravante: hoje, um arquivo JSON corrompido derruba **uma** pessoa e é
recuperável à mão; um `.sqlite` corrompido derruba **todo mundo** de uma vez.

Seria trocar a garantia mais forte do sistema por uma aparência de sofisticação.

---

## 6. O caminho recomendado: banco só de leitura, primeiro

Existe um meio-termo que entrega a maior parte do valor com risco praticamente nulo, e é
por ele que se deve começar.

**Um banco alimentado a partir dos arquivos JSON, apenas para leitura e relatório.** Uma
rotina agendada varre a pasta da rede e carrega o Postgres. Ninguém muda o caminho de
escrita: o escritor único continua valendo, o offline continua valendo, os arquivos das
pessoas continuam sendo a verdade, e o aplicativo não muda uma linha.

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

### 6.2. Esboço do esquema

Tirado dos esquemas reais (`Projeto_Design.md` seções 3.3 e 7.5). Os identificadores
originais são preservados como chave, para que a carga seja idempotente — rodar duas
vezes não duplica nada.

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

### 6.3. Dimensionamento dos dois caminhos

| | Só leitura (recomendado) | Backend completo |
|---|---|---|
| vCPU | 2 | 2–4 |
| RAM | 4 GB | 4–8 GB |
| Disco | 40 GB | 80 GB (dado + WAL + backup local) |
| Componentes | Postgres + rotina agendada | Postgres + API + runtime + sessão/SSO |
| Acesso à pasta da rede | **Sim** — a rotina lê a pasta | Não, depois do corte |
| Quem opera | Quem já cuida de servidores | O mesmo, com plantão |
| Se cair | Relatórios ficam desatualizados; **o aplicativo continua funcionando** | **O aplicativo para** |

A última linha é a diferença que importa. No caminho recomendado, o banco é um acessório
de leitura: cair não impede ninguém de lançar. No backend completo, o banco *é* o sistema.

---

## 7. Recomendação

**Não acrescente banco de dados a esta versão.** Acrescente-o ao lado, só para leitura,
como descrito na seção 6, e deixe o caminho de escrita como está.

**Passe ao backend completo quando — e só quando — alguma destas deixar de ser desejo e
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
dimensionamento da seção 6.3 é estimativa, e nada aqui foi testado numa instalação de
Postgres da corporação.*
