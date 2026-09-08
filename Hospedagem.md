# Programa de Resultados — COBIB
## Hospedar o aplicativo num servidor da intranet
### Estudo de dimensionamento · medições sobre a versão 1.15
#### Válido para a 1.16, que mudou documentação e o carimbo da versão, nada mais

> Documento de decisão, para quem for pedir uma máquina virtual à infraestrutura da
> corporação. Responde a três perguntas: **é possível?**, **quanto custa em hardware?**
> e **o que hospedar não resolve?**
>
> As medições de tamanho, tráfego e disponibilidade de API foram aferidas diretamente.
> As cifras de memória, disco e cabeçalhos de cache são derivadas dessas medições e da
> prática usual de servidores estáticos. **Nada aqui foi validado num servidor real da
> intranet** — o teste de aceitação da seção 7 é o que fecha essa lacuna.

---

## 1. O requisito que bloqueia

**Servir por HTTP simples não entrega um aplicativo degradado: entrega um aplicativo
inútil.**

A API que dá acesso à pasta da rede (`showDirectoryPicker`) só existe em **contexto
seguro**. Numa origem `http://` que não seja `localhost`, ela não existe — e sem ela não
há como conectar a pasta, ou seja, não há lançamento, não há aprovação, não há nada. O
aplicativo abre, desenha a tela e então informa que o navegador não oferece acesso a
pastas: exatamente a mesma recusa que daria no Firefox.

O primeiro item da requisição, portanto, não é hardware. É **HTTPS com certificado
reconhecido por todas as estações**. Sem isso, não vale a pena provisionar a máquina.

### 1.1. O teste que produziu esta conclusão

A mesma página-sonda foi carregada em três origens, no Chrome, para saber quais APIs o
navegador oferece em cada uma:

| Origem | Contexto seguro | `showDirectoryPicker` | Service worker | Resultado |
|---|---|---|---|---|
| `file://…` | sim | sim | indisponível por protocolo | Funciona — **é como se usa hoje** |
| `http://localhost` | sim | sim | sim | Funciona (só na própria máquina) |
| `http://<ip da intranet>` | **não** | **não** | **não** | **Não conecta a pasta** |

A terceira linha é exatamente o cenário "publiquei num servidor da intranet por HTTP".

Repare na primeira: `file://` **é** contexto seguro, e é por isso que o duplo clique a
partir da pasta de rede funciona hoje. Hospedar não conserta nada que esteja quebrado —
ver a seção 6, sobre o que se ganha e o que se perde.

---

## 2. A resposta

Para uma VM Linux servindo arquivos estáticos (nginx, Apache ou Caddy). **O aplicativo
não executa nada no servidor.**

| Cenário | vCPU | RAM | Disco | Quando escolher |
|---|---|---|---|---|
| **Mínimo viável** — Linux enxuto + nginx | 1 | 1 GB | 10 GB | Se o catálogo de VMs da corporação permitir esse tamanho. |
| **Recomendado** — Linux + nginx | 2 | 2 GB | 20 GB | Folga para atualização do SO, log e um agente de monitoramento. É o que se pede. |
| **Windows Server + IIS** | 2 | 4 GB | 60 GB | O custo é todo do sistema operacional, não do aplicativo. Escolha só se a padronização da casa exigir. |

Rede: qualquer enlace de intranet sobra — ver o cálculo de tráfego em 3.2.

> **Antes de pedir a VM:** se a corporação já tiver um servidor de arquivos da intranet no
> ar, a melhor opção é **não criar máquina nenhuma**. Publique a pasta `code/` nele, desde
> que atenda por HTTPS.

---

## 3. Por que é tão pouco

Porque **o servidor não está no caminho do dado**. Ele entrega cerca de 1 MB de arquivos
estáticos e sai de cena. Todo lançamento, toda aprovação e toda ausência continuam indo
do navegador direto para a pasta de rede do Windows, pela File System Access API — o
servidor nunca vê nem guarda um lançamento sequer.

```
  Servidor da intranet          Navegador              Pasta da rede
  HTTPS, arquivos estáticos     Chrome ou Edge         unidadeCentral (Windows)
         │                          │                        │
         │ ──── 447 KB ───────────► │                        │
         │   1× por versão          │ ◄──── lê e grava ────► │
         │                          │      o tempo todo      │
```

O dado nunca atravessa o servidor. Ele é o caminho fino; a pasta da rede é o grosso.
A consequência está em 6.1: hospedar **não substitui** a pasta compartilhada, soma-se a ela.

### 3.1. Tamanho do que é servido

Medido sobre a versão 1.15. A coluna "com gzip" é o que trafega de fato, com compressão
ligada no servidor (seção 4.2).

Números em KB decimais (1 KB = 1000 bytes), que é como o navegador e o servidor contam
tráfego.

| Arquivo | Bruto | Com gzip | Observação |
|---|---:|---:|---|
| `echarts.min.js` | 533 KB | 177 KB | Biblioteca de gráficos, embarcada |
| `index.html` | 218 KB | 64 KB | Interface, lógica e CSS, tudo num arquivo |
| `ajuda/*.webp` | 189 KB | 188 KB | 4 capturas; já comprimidas, gzip não ajuda |
| `catalogo.js` | 17 KB | 5 KB | Único arquivo buscado na rede a cada abertura |
| `icons/*.png` | 16 KB | 8 KB | Ícones do PWA |
| `rede.js` | 11 KB | 4 KB | — |
| `versao.js` + `manifest.webmanifest` | 2 KB | 1 KB | — |
| **Total do primeiro acesso** | **986 KB** | **447 KB** | São as 12 entradas de arquivo da lista `ARQUIVOS`, no `sw.js` |

A lista tem 13 entradas: os 12 arquivos acima mais `"./"`, que é o próprio `index.html`
pedido pela raiz.

O repositório inteiro em `code/` ocupa 1,05 MiB. A diferença para os 986 KB acima são o
`LEIA-ME.txt` e o `gerar-senha.html`, que não entram no cache do service worker.

### 3.2. Tráfego

| Situação | Volume | Procedência |
|---|---|---|
| Primeiro acesso de cada pessoa, por versão publicada | 447 KB | medido |
| Aberturas seguintes | ~5 KB — só o `catalogo.js`, que é rede-first desde a 1.10 | medido |
| 50 pessoas, uma versão nova | 22 MB no total, uma única vez | derivado |

Para comparação: **uma versão publicada gera menos tráfego que um anexo de e-mail de
25 MB.** Não há aqui um problema de capacidade a resolver — há um problema de
certificado.

---

## 4. Configuração do servidor

Quatro ajustes. Os dois primeiros são obrigatórios; os dois últimos evitam defeitos
difíceis de diagnosticar depois.

### 4.1. TLS com certificado da CA corporativa

O certificado precisa ser **confiável nas estações** — na prática, emitido pela autoridade
interna e distribuído por GPO. Certificado autoassinado e não distribuído não serve: o
navegador não considera a origem segura, e recaímos na terceira linha da tabela de 1.1.

### 4.2. Compressão nos arquivos de texto

Gzip ou Brotli em `.html`, `.js` e `.webmanifest`. Reduz a carga inicial de 986 KB para
447 KB — quase toda a economia vem de dois arquivos, o `echarts.min.js` e o
`index.html`. **Não** comprima `.webp` nem `.png`: já estão comprimidos, e o gzip só
gastaria CPU para não reduzir nada (ver a linha das capturas em 3.1).

### 4.3. Cabeçalhos de cache — a exceção que importa

O aplicativo se versiona sozinho: o `sw.js` monta a chave do cache a partir do
`versao.js` (ver seção 1.3 do `Projeto_Design.md`). Se o servidor mandar o navegador
guardar esses dois arquivos por muito tempo, **publicar uma versão nova deixa de surtir
efeito** — e o sintoma é o mais difícil de diagnosticar que existe, porque a tela
continua funcionando, só que velha.

| Arquivo | Cabeçalho | Por quê |
|---|---|---|
| `sw.js` | `no-cache` | É quem descobre que há versão nova |
| `versao.js` | `no-cache` | É onde o número da versão está escrito |
| `catalogo.js` | `no-cache` | Editado sem publicar versão; já é rede-first desde a 1.10 |
| `index.html` | `no-cache` | Quem carrega os três acima |
| `echarts.min.js`, `icons/`, `ajuda/` | `max-age` longo | Só mudam quando o service worker troca de chave |

### 4.4. Tipos MIME

`.webmanifest` como `application/manifest+json` e `.webp` como `image/webp`. **O IIS não
conhece nenhum dos dois de fábrica:** sem o registro, o ícone do PWA e as quatro capturas
da Ajuda voltam como 404.

---

## 5. Riscos a registrar

| Risco | Efeito | Mitigação |
|---|---|---|
| **Certificado vence** | Perde-se o contexto seguro e, com ele, o acesso à pasta. O aplicativo para para todo mundo ao mesmo tempo. | Monitorar validade; renovação automatizada. |
| **Trocar o endereço depois** | Cache, identidade memorizada e permissão da pasta são gravados **por origem**. Mudar o nome do host obriga todos a reconectar a pasta e se identificar de novo. | Escolher o nome definitivo antes de publicar. Preferir um nome de serviço estável a um endereço IP. |
| **Cabeçalho de cache agressivo** | Versões novas não chegam, e a tela não dá sinal de estar velha. | A tabela de 4.3. Conferir a etiqueta da versão no rail depois de publicar. |
| **Servir a pasta inteira** | `LEIA-ME.txt` e `gerar-senha.html` ficam legíveis por quem alcançar o servidor. Não é vazamento — os dois já estão no repositório público —, mas o LEIA-ME descreve o procedimento de recuperação da senha do administrador. | Opcional: publicar só os 12 arquivos da lista `ARQUIVOS` do `sw.js`. |

---

## 6. O que hospedar não resolve

Vale dizer com todas as letras, para que a requisição não seja aprovada esperando o que
ela não entrega.

### 6.1. Não resolve

- **Não elimina a pasta da rede.** Os dados continuam lá, e as permissões NTFS continuam
  sendo a única segurança real do sistema (ver "Segurança recomendada" no `LEIA-ME.txt`).
- **Não amplia os navegadores.** Chrome e Edge, como hoje — a limitação é da API, não da
  forma de servir.
- **Não é backup.** O servidor não guarda dado de ninguém. Perder a VM custa o tempo de
  republicar 1 MB de arquivos.
- **Acrescenta uma dependência.** Hoje basta a pasta estar no ar; depois, precisam estar
  no ar a pasta **e** o servidor.

### 6.2. Resolve — e é o motivo de considerar

- **Uma versão só, canônica.** Acaba a chance de alguém abrir uma cópia antiga esquecida
  numa pasta pessoal.
- **Instalação como PWA**, com ícone próprio: só existe sob HTTP(S).
- **Cache offline pelo service worker**, que hoje, aberto por duplo clique, não chega a
  ser registrado — sob `file://` não há service worker.
- **Atualizar deixa de ser copiar arquivo:** publica-se num lugar só.

### 6.3. Recomendação

Vale a pena **se, e somente se**, a CA corporativa emitir o certificado e ele for
distribuído às estações. Com certificado, os ganhos de 6.2 são reais e o custo de
hardware é desprezível. Sem certificado, a resposta não é "publique assim mesmo": é
continuar abrindo o `index.html` da pasta da rede, que funciona hoje e continuará
funcionando.

---

## 7. Checklist da requisição

- [ ] Certificado TLS da CA corporativa, com o nome de host definitivo
      — *sem isto, não provisione: o aplicativo não funciona*
- [ ] VM Linux, 2 vCPU / 2 GB / 20 GB, com nginx
      — *ou publicação num servidor de arquivos da intranet que já exista*
- [ ] A VM precisa alcançar a pasta `unidadeCentral`? **Não.**
      — *quem alcança a pasta é a estação de trabalho, não o servidor*
- [ ] Compressão ligada para texto; MIME de `.webp` e `.webmanifest` registrados
- [ ] `Cache-Control` conforme a tabela de 4.3
- [ ] **Teste de aceitação:** abrir pelo endereço final, conectar a pasta, lançar uma
      atividade e conferir a etiqueta da versão no rail
      — *é o teste que prova o contexto seguro na prática*

---

*Programa de Resultados — COBIB · Estudo de hospedagem, medido sobre a versão 1.15
(set/2026). Documento vivo: se o aplicativo ganhar arquivo novo, ou se a lista `ARQUIVOS`
do `sw.js` mudar, as cifras da seção 3 mudam junto.*
