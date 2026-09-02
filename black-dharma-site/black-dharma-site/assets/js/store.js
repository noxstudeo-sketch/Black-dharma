/* ============================================================
   BLACK DHARMA — Camada de dados (acervo, grimório, progresso)
   ------------------------------------------------------------
   Um só conjunto de funções para o painel usar. Por baixo:
     • Supabase configurado  -> grava no banco (real, seguro por RLS)
     • Sem Supabase (demo)    -> grava no localStorage do navegador
   O painel não precisa saber em qual modo está — só chama BD_STORE.
   ============================================================ */
window.BD_STORE = (function () {
  var sb = window.BD_SUPABASE;      // null em modo demo
  var DEMO = !sb;

  // ---- helpers de localStorage (modo demo) ----
  function lsGet(key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
    catch (e) { return def; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function uid() { return "bd_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8); }

  var K_ACERVO = "bd_demo_acervo";
  var K_GRIM   = "bd_demo_grimorio";
  var K_PROG   = "bd_demo_progresso";

  return {
    demo: DEMO,

    /* ---------------- ACERVO (materiais salvos) ---------------- */
    async listAcervo() {
      if (DEMO) return lsGet(K_ACERVO, []);
      var r = await sb.from("acervo").select("*").order("created_at", { ascending: false });
      return (r && r.data) || [];
    },
    async addAcervo(item) {
      // item: { item_type, item_ref, title }
      if (DEMO) {
        var list = lsGet(K_ACERVO, []);
        if (list.some(function (x) { return x.item_ref === item.item_ref; })) return { duplicate: true };
        list.unshift({ id: uid(), created_at: new Date().toISOString(), ...item });
        lsSet(K_ACERVO, list);
        return { ok: true };
      }
      // Real: user_id vem do DEFAULT auth.uid() no banco; RLS confere.
      var r = await sb.from("acervo").insert(item);
      return r.error ? { error: r.error } : { ok: true };
    },
    async removeAcervo(id) {
      if (DEMO) {
        lsSet(K_ACERVO, lsGet(K_ACERVO, []).filter(function (x) { return x.id !== id; }));
        return { ok: true };
      }
      var r = await sb.from("acervo").delete().eq("id", id);
      return r.error ? { error: r.error } : { ok: true };
    },
    async inAcervo(ref) {
      var list = await this.listAcervo();
      return list.some(function (x) { return x.item_ref === ref; });
    },

    /* ---------------- GRIMÓRIO (diário pessoal) ---------------- */
    async listGrimorio() {
      if (DEMO) return lsGet(K_GRIM, []);
      var r = await sb.from("grimorio_entries").select("*").order("updated_at", { ascending: false });
      return (r && r.data) || [];
    },
    async saveGrimorio(entry) {
      // entry: { id?, title, body }
      if (DEMO) {
        var list = lsGet(K_GRIM, []);
        if (entry.id) {
          list = list.map(function (x) { return x.id === entry.id ? { ...x, title: entry.title, body: entry.body, updated_at: new Date().toISOString() } : x; });
        } else {
          list.unshift({ id: uid(), title: entry.title, body: entry.body, updated_at: new Date().toISOString() });
        }
        lsSet(K_GRIM, list);
        return { ok: true };
      }
      if (entry.id) {
        var r1 = await sb.from("grimorio_entries").update({ title: entry.title, body: entry.body, updated_at: new Date().toISOString() }).eq("id", entry.id);
        return r1.error ? { error: r1.error } : { ok: true };
      }
      var r2 = await sb.from("grimorio_entries").insert({ title: entry.title, body: entry.body });
      return r2.error ? { error: r2.error } : { ok: true };
    },

    /* ---------------- PROGRESSO DE LEITURA ---------------- */
    getProgress(ref) {
      if (DEMO) return lsGet(K_PROG, {})[ref] || 0;
      return lsGet(K_PROG, {})[ref] || 0; // progresso fica local mesmo com Supabase (leve)
    },
    setProgress(ref, pct) {
      var all = lsGet(K_PROG, {});
      all[ref] = pct;
      lsSet(K_PROG, all);
    }
  };
})();
