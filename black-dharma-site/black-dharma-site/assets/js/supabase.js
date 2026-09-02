/* ============================================================
   BLACK DHARMA — Conexão com o Supabase
   ------------------------------------------------------------
   AQUI vão SÓ as duas chaves PÚBLICAS do seu projeto Supabase:
     • a URL do projeto
     • a chave "anon" (também chamada "publishable")

   Estas duas podem ficar no site sem problema — elas só funcionam
   porque o banco tem Row Level Security (o schema.sql). É isso que
   torna seguro publicar este arquivo.

   >>> NUNCA <<< coloque aqui (nem em nenhum arquivo do site):
     • a chave "service_role" / "secret"
     • o Access Token do Mercado Pago
     • qualquer senha de banco
   Essas moram só no servidor (Edge Functions), numa etapa futura.

   Onde achar as chaves públicas:
     Supabase -> Project Settings -> API -> Project URL e anon key.
   ============================================================ */

// 1) Cole os SEUS valores aqui (troque os dois de baixo):
window.BD_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "COLE-AQUI-SUA-CHAVE-ANON-PUBLICA"
};

// 2) Inicializa o cliente (não precisa mexer daqui pra baixo).
(function () {
  var cfg = window.BD_CONFIG || {};
  var placeholders =
    !cfg.SUPABASE_URL ||
    cfg.SUPABASE_URL.indexOf("SEU-PROJETO") !== -1 ||
    !cfg.SUPABASE_ANON_KEY ||
    cfg.SUPABASE_ANON_KEY.indexOf("COLE-AQUI") !== -1;

  // A biblioteca do Supabase é carregada antes deste arquivo (via CDN).
  var lib = window.supabase;

  if (placeholders || !lib) {
    // Ainda não configurado: o site roda em "modo demonstração".
    window.BD_SUPABASE = null;
    return;
  }

  window.BD_SUPABASE = lib.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,       // mantém o membro logado entre visitas
      autoRefreshToken: true,     // renova o token sozinho
      detectSessionInUrl: true    // necessário p/ confirmação de e-mail e reset de senha
    }
  });
})();
