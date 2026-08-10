/* =========================================================
   VERSÃO — o ÚNICO lugar onde a versão do aplicativo é escrita.

   Quem lê este arquivo:
     index.html  -> a etiqueta ao lado do nome, no alto do rail, e a
                    janela "Sobre o programa";
     sw.js       -> a chave do cache offline ("ra-" + versao), via
                    importScripts.

   Ao publicar uma versão nova, são DUAS coisas que precisam concordar:
   este arquivo e a tag do repositório (a versão "1.1" corresponde à tag
   v1.1 e à chave de cache "ra-1.1"). Antes da v1.1 eram três, e o
   número ficava escrito à mão em dois arquivos diferentes: bastava
   esquecer um para a tela dizer uma coisa e o cache servir outra.

   A data de atualização é preenchida à mão, aqui do lado, de propósito:
   buscá-la do GitHub exigiria acesso à internet, e este aplicativo
   existe justamente para funcionar sem ela (ver LEIA-ME).
   ========================================================= */
const APP = {
  versao:      "1.2",                  // acompanha a tag do repositório
  rotulo:      "versão 1.2 (ago/26)",  // etiqueta exibida no rail
  atualizado:  "10.08.2026",           // data desta publicação
  repositorio: "https://github.com/ErnyBSB/resultados"
};
