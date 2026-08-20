/* =========================================================
   REDE — acesso à pasta compartilhada \\COBIB\AmbienteTrabalho\unidadeCentral
   via File System Access API (Chrome e Edge).

   Estrutura esperada dentro de unidadeCentral:
     <UNIDADE>/lancamentos/<servidor>.json   (cada servidor grava só o seu)
     <UNIDADE>/aprovacoes.json               (só a chefia da unidade grava)

   Padrão "um arquivo, um único escritor": não há escrita concorrente
   no mesmo arquivo, portanto não há conflito entre máquinas.
   ========================================================= */
"use strict";

/* ---------- IndexedDB: guarda o handle da pasta entre sessões ---------- */
function _idb() {
  return new Promise((res, rej) => {
    const rq = indexedDB.open("ra-rede", 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore("handles");
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
}
async function salvarHandleRaiz(handle) {
  const db = await _idb();
  await new Promise((res, rej) => {
    const tx = db.transaction("handles", "readwrite");
    tx.objectStore("handles").put(handle, "raiz");
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function obterHandleRaiz() {
  const db = await _idb();
  return new Promise((res) => {
    const rq = db.transaction("handles").objectStore("handles").get("raiz");
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => res(null);
  });
}

/* ---------- Permissões ---------- */
async function garantirPermissao(handle, modo /* "read" | "readwrite" */, pedir = true) {
  const opts = { mode: modo };
  if (await handle.queryPermission(opts) === "granted") return true;
  if (!pedir) return false;
  return (await handle.requestPermission(opts)) === "granted";
}

/* ---------- Utilitários de arquivo ---------- */
function slug(nome) {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
             .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
async function lerJSONDe(dir, nomeArquivo) {
  try {
    const fh = await dir.getFileHandle(nomeArquivo);
    const texto = await (await fh.getFile()).text();
    return texto.trim() ? JSON.parse(texto) : null;
  } catch { return null; }
}
async function gravarJSONEm(dir, nomeArquivo, obj) {
  const fh = await dir.getFileHandle(nomeArquivo, { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(obj, null, 2));
  await w.close();
}
async function pastaUnidade(raiz, unidade, criar = false) {
  return raiz.getDirectoryHandle(unidade, { create: criar });
}
async function pastaLancamentos(raiz, unidade, criar = false) {
  const u = await pastaUnidade(raiz, unidade, criar);
  return u.getDirectoryHandle("lancamentos", { create: criar });
}

/* ---------- Leituras de alto nível ---------- */
/* Lançamentos de um servidor: {registros:[...]} ou vazio */
async function lerMeuArquivo(raiz, unidade, servidor) {
  try {
    const dir = await pastaLancamentos(raiz, unidade);
    return await lerJSONDe(dir, slug(servidor) + ".json");
  } catch { return null; }
}
/* cargaHoraria (8 ou 6) fica no CABEÇALHO do arquivo da própria pessoa:
   ela já é a única escritora deste arquivo, então o dado entra sem
   quebrar o padrão "um arquivo, um único escritor" nem exigir escrita
   no config.json (que é do administrador). */
async function gravarMeuArquivo(raiz, unidade, servidor, registros, cargaHoraria, ausencias) {
  const dir = await pastaLancamentos(raiz, unidade, true);
  await gravarJSONEm(dir, slug(servidor) + ".json", {
    versao: 3, unidade, servidor,
    cargaHoraria: cargaHoraria ?? null,
    atualizadoEm: new Date().toISOString(),
    registros,
    /* Ausências ficam no MESMO arquivo pelo mesmo motivo da carga
       horária: a pessoa já é a única escritora dele. */
    ausencias: ausencias || []
  });
}
/* Leitura ESTRITA, obrigatória antes de qualquer gravação.

   lerMeuArquivo() devolve null tanto para "o arquivo não existe" quanto
   para "o arquivo existe mas está ilegível" — e regravar em cima do
   segundo caso apaga o histórico inteiro da pessoa. Aqui os dois casos
   são separados:

     não existe (ou está vazio)  -> null, pode criar à vontade
     existe e não decifra        -> lança erro, NÃO grave por cima

   O erro leva a marca .arquivoIlegivel para que a tela mostre o texto
   como está, sem prefixo de "falha ao gravar": não houve falha de
   gravação, houve recusa deliberada de gravar. */
async function lerArquivoParaGravar(raiz, unidade, servidor) {
  const arquivo = slug(servidor) + ".json";
  let fh;
  try {
    const dir = await pastaLancamentos(raiz, unidade);
    fh = await dir.getFileHandle(arquivo);
  } catch (e) {
    // só "não encontrado" é seguro tratar como pasta/arquivo novo;
    // falta de permissão e afins têm de subir
    if (e && e.name === "NotFoundError") return null;
    throw e;
  }
  const texto = await (await fh.getFile()).text();
  if (!texto.trim()) return null;   // vazio: não há histórico a perder

  const recusa = (motivo) => {
    const e = new Error(
      `O arquivo ${arquivo} ${motivo}. Gravar por cima apagaria os ` +
      `lançamentos já registrados, então nada foi gravado. Peça ao ` +
      `administrador para conferir esse arquivo na pasta da rede.`);
    e.arquivoIlegivel = true;
    return e;
  };
  let dado;
  try { dado = JSON.parse(texto); }
  catch { throw recusa("existe mas está ilegível (JSON inválido)"); }
  if (!dado || !Array.isArray(dado.registros))
    throw recusa("não tem a lista de lançamentos no formato esperado");
  return dado;
}

/* Carga horária já gravada por esta pessoa, ou null se ainda não marcou
   (arquivo inexistente ou gravado por uma versão anterior à v11). */
async function lerCargaHoraria(raiz, unidade, servidor) {
  const dado = await lerMeuArquivo(raiz, unidade, servidor);
  const c = dado && dado.cargaHoraria;
  return (c === 8 || c === 6) ? c : null;
}
/* Todas as ausências de uma unidade (lista concatenada). Cada ausência
   já carrega servidor e unidade, como os lançamentos. */
async function lerAusenciasDaUnidade(raiz, unidade) {
  const ausencias = [];
  try {
    const dir = await pastaLancamentos(raiz, unidade);
    for await (const [nome, handle] of dir.entries()) {
      if (handle.kind !== "file" || !nome.endsWith(".json")) continue;
      try {
        const dado = JSON.parse(await (await handle.getFile()).text());
        if (dado && Array.isArray(dado.ausencias)) ausencias.push(...dado.ausencias);
      } catch { /* arquivo malformado: ignora e segue */ }
    }
  } catch { /* unidade ainda sem pasta */ }
  return ausencias;
}
/* Todos os lançamentos de uma unidade (lista concatenada) */
async function lerLancamentosDaUnidade(raiz, unidade) {
  const registros = [];
  try {
    const dir = await pastaLancamentos(raiz, unidade);
    for await (const [nome, handle] of dir.entries()) {
      if (handle.kind !== "file" || !nome.endsWith(".json")) continue;
      try {
        const dado = JSON.parse(await (await handle.getFile()).text());
        if (dado && Array.isArray(dado.registros)) registros.push(...dado.registros);
      } catch { /* arquivo malformado: ignora e segue */ }
    }
  } catch { /* unidade ainda sem pasta */ }
  return registros;
}
/* Aprovações da unidade: mapa {idLancamento: {por, em}} */
async function lerAprovacoes(raiz, unidade) {
  try {
    const dir = await pastaUnidade(raiz, unidade);
    const dado = await lerJSONDe(dir, "aprovacoes.json");
    return (dado && dado.aprovacoes) || {};
  } catch { return {}; }
}
async function gravarAprovacoes(raiz, unidade, aprovacoes, chefe) {
  const dir = await pastaUnidade(raiz, unidade, true);
  await gravarJSONEm(dir, "aprovacoes.json", {
    versao: 1, unidade, chefe,
    atualizadoEm: new Date().toISOString(),
    aprovacoes
  });
}

/* ---------- Configuração central (config.json na raiz) ---------- */
/* O config.json é o ÚNICO arquivo em que "não existe" e "existe mas não
   dá para ler" precisam ser respostas DIFERENTES. O lerJSONDe devolve
   null para os dois, e isso é proposital lá: num arquivo de lançamentos,
   um campo a menos não pode derrubar a tela. Aqui a mesma indulgência
   custava caro — o programa anunciava pasta virgem, o administrador
   acreditava e mandava oficializar, e a oficialização gravava o catálogo
   VAZIO da semente por cima da configuração real.

   Devolve { estado, dados, motivo }, com estado em:
     "ausente"  — não há config.json; pasta nova, pode ser oficializada;
     "ilegivel" — o arquivo está lá e não pôde ser lido ou entendido;
     "ok"       — leu e tem a cara de uma configuração.

   Arquivo vazio conta como ilegível, e não como ausente: zero byte é o
   que sobra de uma gravação interrompida, justamente a hora em que
   oficializar por cima seria o pior a fazer. */
async function lerConfig(raiz) {
  let fh;
  try {
    fh = await raiz.getFileHandle("config.json");
  } catch {
    return { estado: "ausente", dados: null, motivo: null };
  }
  try {
    const texto = await (await fh.getFile()).text();
    if (!texto.trim())
      return { estado: "ilegivel", dados: null, motivo: "o arquivo está vazio" };
    const dados = JSON.parse(texto);
    if (!dados || typeof dados !== "object" || Array.isArray(dados))
      return { estado: "ilegivel", dados: null, motivo: "o conteúdo não é um objeto JSON" };
    if (!dados.unidades)
      return { estado: "ilegivel", dados: null, motivo: 'falta a chave "unidades"' };
    return { estado: "ok", dados, motivo: null };
  } catch (e) {
    return { estado: "ilegivel", dados: null, motivo: e.message };
  }
}
async function gravarConfig(raiz, cfg) {
  await gravarJSONEm(raiz, "config.json", {
    ...cfg, versao: 1, atualizadoEm: new Date().toISOString()
  });
}
