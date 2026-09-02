/* ============================================================
   BLACK DHARMA — Funções de acesso (login, cadastro, sessão)
   ------------------------------------------------------------
   Tudo passa pelo Supabase Auth. Nós NUNCA guardamos ou conferimos
   senha na mão — o Supabase faz isso do jeito certo (hash, tokens,
   confirmação de e-mail). Expomos um objeto simples: window.BD
   ============================================================ */
(function () {
  var sb = window.BD_SUPABASE; // pode ser null (modo demonstração)

  var BD = {
    ready: !!sb,

    // ---- LOGIN --------------------------------------------------
    async signIn(email, password) {
      if (!sb) return { error: { message: "demo" } };
      return await sb.auth.signInWithPassword({ email: email, password: password });
    },

    // ---- CADASTRO ----------------------------------------------
    // O papel (role) NÃO é enviado daqui — quem define é o banco
    // (schema.sql força 'member'). Mandamos só o nome de exibição.
    async signUp(email, password, displayName) {
      if (!sb) return { error: { message: "demo" } };
      return await sb.auth.signUp({
        email: email,
        password: password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: window.location.origin + "/index.html"
        }
      });
    },

    // ---- RECUPERAR SENHA ---------------------------------------
    async resetPassword(email) {
      if (!sb) return { error: { message: "demo" } };
      return await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/nova-senha.html"
      });
    },

    // ---- SAIR ---------------------------------------------------
    async signOut() {
      if (!sb) return;
      await sb.auth.signOut();
      window.location.href = "index.html";
    },

    // Perfil de demonstração (quando o Supabase ainda não foi ligado).
    demoProfile() {
      var name = "Iniciado(a)";
      try { name = localStorage.getItem("bd_demo_name") || name; } catch (e) {}
      return { id: "demo", display_name: name, role: "member", demo: true };
    },

    // ---- SESSÃO / USUÁRIO ATUAL --------------------------------
    async getUser() {
      if (!sb) return { id: "demo", demo: true };
      var r = await sb.auth.getUser();
      return r && r.data ? r.data.user : null;
    },

    // Lê o perfil (inclui o papel). O RLS garante que só volta o
    // perfil do próprio usuário — o front confia no banco, não o contrário.
    async getProfile() {
      if (!sb) return this.demoProfile();
      var user = await this.getUser();
      if (!user) return null;
      var r = await sb.from("profiles").select("id, display_name, role").eq("id", user.id).single();
      return r && r.data ? r.data : null;
    },

    // "Este membro está em dia?" — pergunta segura ao banco (função is_member_active).
    async isMemberActive() {
      if (!sb) return true; // demo: tudo liberado para você experimentar
      var r = await sb.rpc("is_member_active");
      return !!(r && r.data);
    },

    // Protege uma página: manda pro login quem não estiver autenticado.
    // Use no topo de painel.html, e passe {admin:true} nas páginas de admin.
    async requireAuth(opts) {
      opts = opts || {};
      if (!sb) return this.demoProfile(); // demo: não bloqueia, entra como membro
      var profile = await this.getProfile();
      if (!profile) { window.location.href = "index.html"; return null; }
      if (opts.admin && profile.role !== "admin") {
        // Barreira visual. A barreira REAL é o RLS: mesmo que alguém
        // force a URL, o banco não entrega dados de admin a um membro.
        window.location.href = "painel.html"; return null;
      }
      return profile;
    },

    // Traduz erros técnicos do Supabase em frases claras em PT-BR.
    humanError(error) {
      var m = (error && error.message ? error.message : "").toLowerCase();
      if (m.indexOf("invalid login") !== -1) return "E-mail ou senha incorretos.";
      if (m.indexOf("email not confirmed") !== -1) return "Confirme seu e-mail antes de entrar.";
      if (m.indexOf("already registered") !== -1) return "Este e-mail já pertence à Ordem.";
      if (m.indexOf("rate") !== -1) return "Muitas tentativas. Aguarde um instante.";
      if (m.indexOf("password") !== -1) return "Senha inválida (mínimo 8 caracteres).";
      return "Não foi possível concluir. Tente novamente.";
    }
  };

  window.BD = BD;
})();
