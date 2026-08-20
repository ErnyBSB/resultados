# Perguntas frequentes — Programa de Resultados

Dúvidas do dia a dia, respondidas em texto simples. Este arquivo é **vivo**:
corrigir uma resposta é um commit, e não uma versão nova do programa.

Ele NÃO substitui a **Ajuda embutida**, aquela que abre dentro do aplicativo, no
rail. Lá mora o que é estável — o que o programa é, os papéis, como lançar, como
buscar, o que a meta mede —, e lá funciona sem internet, que é o caso de quem
abre o programa numa máquina que só enxerga a pasta da rede. Aqui moram as
dúvidas que aparecem no uso e mudam de uma semana para a outra.

| | Ajuda embutida | Este arquivo |
|---|---|---|
| Conteúdo | o que o programa é, papéis, como usar | dúvidas de rotina, casos particulares |
| Muda | quando o aplicativo muda | quando alguém pergunta |
| Custo de corrigir | publicar uma versão | um commit |
| Funciona sem internet | sim | não |

Os nomes usados nos exemplos são inventados, os mesmos das capturas da Ajuda
(Helena Barros, Ana Beatriz Nunes, Carlos Eduardo Prado, Marina Duarte, Roberto
Aguiar). Nome de pessoa de verdade não entra aqui, como não entra em nenhum outro
arquivo deste repositório.

---

## Lançamentos

### Esqueci de lançar ontem. Ainda dá?

Dá. A data do lançamento é um campo, e não o dia de hoje fixo: abra "Lançar
atividade", troque a data para o dia que faltou e registre normalmente. O
lançamento entra no dia escolhido, não no dia em que você o digitou.

O que não dá é lançar para **frente**: o calendário cinza os dias futuros, e o
teto é recalculado toda vez que você toca no campo. Foi decisão de projeto —
registro de atividade é do que já aconteceu.

Depois de registrar, a tela pula para o mês da data escolhida, para você conferir
o lançamento onde ele foi parar.

### Lancei a atividade errada e ela já foi aprovada. Como corrijo?

Depois de aprovado, você não consegue mais excluir o próprio lançamento — o botão
"excluir" some. São dois caminhos:

1. **Peça a quem aprovou para desfazer.** No painel, ao lado do lançamento
   aprovado, quem aprovou vê um "desfazer". Desfeita a aprovação, o lançamento
   volta a pendente e você mesmo pode excluí-lo.
2. **Peça ao administrador.** O adm exclui qualquer lançamento, inclusive
   aprovado, e a aprovação correspondente é removida junto.

Atenção a um detalhe do primeiro caminho: **só desfaz quem aprovou**. Se a
aprovação saiu no nome da chefia geral, a chefia da unidade não consegue
desmarcá-la, e vice-versa — o programa avisa na tela quando isso acontece,
dizendo em qual das duas a aprovação foi registrada.

Enquanto o lançamento estiver **pendente**, nada disso é preciso: você exclui e
lança de novo.

---

## Aprovações

### A chefia da unidade está de férias. Quem aprova?

A **chefia geral** pode aprovar os lançamentos de qualquer unidade, inclusive os
dos servidores — não precisa esperar a volta de ninguém.

Duas coisas a saber quando isso acontece:

- a aprovação sai **no nome da chefia geral**, e não no da chefia da unidade;
- só a chefia geral pode desfazê-la depois. A chefia da unidade, ao voltar, verá
  o lançamento como aprovado e não terá o botão "desfazer" para ele.

Não é defeito: cada papel grava no seu próprio arquivo de aprovações, e é isso
que garante que duas pessoas nunca escrevam no mesmo arquivo ao mesmo tempo.

### Ausência precisa de aprovação?

Não. Ausências não valem pontos e não passam por aprovação — ficam no arquivo da
própria pessoa e saem da conta da meta. Só o próprio autor (ou o administrador)
as exclui.

---

## A meta e o percentual

### Meu percentual caiu e eu trabalhei normalmente. Por quê?

Quase sempre porque houve um dia com lançamento **pequeno**.

O percentual não é medido sobre o mês inteiro: o denominador são **só os dias em
que você lançou alguma coisa**. Cada um desses dias entra na conta valendo a meta
cheia — 15 pontos para quem cumpre 8 horas, 11 para quem cumpre 6.

A consequência é contraintuitiva e vale entender de uma vez: **um dia com um
lançamento pequeno derruba mais o percentual do que um dia sem lançamento
nenhum.** O dia sem lançamento fica de fora da conta; o dia com 5 pontos entra
como 5 de 15.

Exemplo. Marina Duarte cumpre 8 horas e lançou:

| Dia | Pontos | Entra na conta? |
|---|---|---|
| segunda | 15 | sim — 15 de 15 |
| terça | 15 | sim — 15 de 15 |
| quarta | 5 | sim — 5 de 15 |
| quinta | — | não |

O percentual é 35 de 45, ou seja 78% — e não 35 de 60. A quinta-feira não pesa;
a quarta, sim.

Por isso o número **nunca aparece sozinho**: vem sempre com "em N dia(s)", que é
o que distingue quem bateu a meta em 2 dias de quem bateu em 20.

### Registrei uma ausência. Ela derruba o percentual?

Não — e é o contrário: os dias cobertos por uma ausência registrada saem da conta
inteira, tanto do denominador quanto dos pontos. Férias, licença ou banco de
horas não fazem o percentual cair.

Repare que o período da ausência é contado em dias **corridos**, incluindo fins
de semana e feriados. No percentual, porém, o que conta é outra coisa: apenas os
dias com lançamento que caem dentro do período é que saem da conta.

### A tela diz "N dia(s) fora da conta (sem carga)". O que falta?

Lançamentos feitos antes da v11 não guardam a carga horária de quem lançou, e sem
ela não há meta com que comparar. Esses dias ficam de fora do cálculo, e o
programa diz quantos são em vez de fingir um número inteiro.

Não há o que corrigir: são lançamentos antigos, continuam valendo, aparecem nas
tabelas e saem na exportação como todos os outros. Só não entram no percentual.

---

## Cadastro e nomes

### O nome de uma pessoa mudou. E os lançamentos antigos?

**Renomear desvincula o histórico**, e isso precisa ser feito com cuidado.

O arquivo de lançamentos de cada pessoa é nomeado a partir do nome dela. Trocado
o nome no cadastro, o programa passa a procurar um arquivo diferente: o antigo
continua na pasta da rede, intacto, mas ninguém mais o enxerga pela tela. A senha
também fica para trás, porque está guardada sob o nome antigo.

Se a troca for necessária (um nome digitado errado, por exemplo), o caminho é
combinar com o administrador **antes**: renomear o arquivo antigo na pasta da
rede junto com a troca no cadastro, e definir a senha de novo. Só mexer no
cadastro deixa o histórico órfão.

Vale a pena escrever o nome com calma no cadastro inicial, justamente para não
precisar disso.

---

## Acesso à pasta

### O programa diz que a pasta abriu "somente para leitura". E agora?

Quer dizer que o navegador entregou a pasta sem permissão de escrita — então
lançamentos e aprovações não poderiam ser gravados, e o programa preferiu não
dizer "Conectado" para depois falhar na hora de salvar.

A causa é do ambiente, não do programa. Vale conferir, nessa ordem:

1. os direitos da sua conta naquela pasta da rede (com quem administra a rede);
2. no navegador, a permissão de **edição de arquivos** para este site.

### Abri o programa e ele não pediu permissão nenhuma. Está quebrado?

Não necessariamente, mas é sinal de que algo no ambiente está barrando o acesso —
já houve caso de uma máquina, idêntica às demais, em que o pedido de permissão
simplesmente não aparecia, e o programa funcionava ao ser copiado para o disco
local.

A partir da v1.11 a tela explica o que aconteceu em vez de ficar calada. Anote a
mensagem exata que aparece — ela fica na tela até você fazer outra coisa,
justamente para poder ser anotada — e leve-a a quem administra a rede.

### Preciso escolher a pasta toda vez que abro o programa?

A pasta fica memorizada no seu computador, mas o navegador não guarda a
**permissão** de uma sessão para a outra. Ao reabrir, o botão deve dizer
"Reconectar pasta": um clique e uma confirmação, sem precisar procurar a pasta de
novo.

Se em vez disso ele disser "Conectar pasta" e abrir o seletor, é porque a
memorização se perdeu — normalmente por limpeza de dados do navegador.

---

## Como uma pergunta entra aqui

As dúvidas chegam pelos canais de sempre — conversa, e-mail, a chefia da unidade
— e o **administrador** escreve a resposta e a publica num commit. Não é preciso
ter conta no GitHub nem saber mexer no repositório para contribuir: basta
perguntar.

Uma regra ao escrever: resposta que descreve comportamento do programa tem de
bater com o código. Quando o comportamento mudar, este arquivo entra na mesma
revisão.
