# Programa de Resultados — COBIB

Aplicativo web para o registro diário de processos de trabalho e atividades da
COBIB. Cada servidor lança o que fez, com a complexidade correspondente, e a
chefia aprova os lançamentos da sua unidade.

**Versão 1.2** (ago/26). Até a 1.0 o programa se chamou *Registro de Atividades*
e circulou como versão beta, numerada de 1 a 14, no repositório
[actividades](https://github.com/ErnyBSB/actividades).

## Como funciona

Não há servidor. Todo o estado compartilhado mora numa pasta de rede do Windows
(`\\COBIB\AmbienteTrabalho\unidadeCentral`), alcançada pelo navegador através da
File System Access API — por isso o aplicativo roda **apenas em Chrome e Edge**.
O funcionamento offline vem de um service worker que serve primeiro o cache.

Cada arquivo tem um único autor: cada servidor grava somente o seu
`<UNIDADE>/lancamentos/<servidor>.json`, e cada chefia de unidade grava somente
o `<UNIDADE>/aprovacoes.json` da sua. Não há como dois papéis disputarem o mesmo
arquivo.

## Como abrir

Abra `code/index.html` no Chrome ou no Edge. Não há instalação, dependência,
compilação nem passo de build: a pasta `code` é o aplicativo inteiro.

Para instalar como PWA, abra o arquivo servido pela pasta da rede e use a opção
de instalação do navegador.

## O que tem aqui

```
code/                    o aplicativo
  index.html             interface, lógica e CSS
  versao.js              o único lugar onde a versão é escrita (etiqueta do
                         rail, janela "Sobre" e chave do cache saem daqui)
  catalogo.js            catálogo editável: unidades, servidores, processos,
                         atividades, pontos de complexidade, tipos de ausência
  rede.js                acesso à pasta de rede (permissões, leitura e escrita)
  sw.js                  service worker; monta a chave do cache a partir do versao.js
  manifest.webmanifest   metadados do PWA
  gerar-senha.html       ferramenta avulsa: gera o hash das senhas do config.json
  echarts.min.js         biblioteca de gráficos (embarcada, não baixada)
  icons/                 ícones do PWA
  ajuda/                 capturas usadas na tela de Ajuda
  LEIA-ME.txt            a documentação de verdade: o que faz, e por quê
Projeto_Design.md             relatório técnico do projeto (acompanha a versão atual)
Projeto_Design_until_v8.pdf   o mesmo relatório para as versões beta 1 a 8
```

`LEIA-ME.txt` é a leitura principal para quem for mexer no programa. Ele não é
uma lista de mudanças: explica o motivo de cada decisão e admite as limitações.

`Projeto_Design.md` é o relatório técnico do projeto — arquitetura, modelo de
dados, perfis, decisões e limitações —, escrito para quem chega sem conhecer o
código. Ele descreve sempre a versão em uso, sem número no nome: versão é tag, não
nome de arquivo. Substitui o `Projeto_Design_until_v8.pdf`, que continua aqui como
registro de como o sistema era na beta 8.

## Versões

O controle de versões é feito exclusivamente por **commits e tags**. Não há
pastas por versão — a pasta `code` é sempre a versão atual, e cada versão
publicada recebe uma tag (`v1.0`, `v1.1`, …).

Para ver ou recuperar uma versão publicada:

```sh
git tag                  # lista as versões publicadas
git show v1.0            # o que foi essa versão
git checkout v1.0        # traz os arquivos daquela versão
```

Ao publicar uma versão nova, **duas coisas precisam concordar**:

1. `code/versao.js` → o número, a etiqueta e a data de atualização. A etiqueta do
   rail, a janela "Sobre o programa" e a chave do cache do service worker
   (`"ra-" + versao`) saem todas daí — sem trocar isso, o navegador continua
   servindo o cache antigo e a mudança não aparece;
2. a tag do repositório.

Até a 1.0 eram três: o número ficava escrito à mão também no `index.html` e no
`sw.js`. A v1.1 juntou os dois num arquivo só.

## Licença

Ver [LICENSE](LICENSE).
