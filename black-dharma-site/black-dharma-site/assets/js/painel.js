/* ============================================================
   BLACK DHARMA — Lógica da área do membro
   Liga a interface (painel.html) aos dados (store.js), ao conteúdo
   (corpus.js) e ao oráculo (oracle.js). Funciona em modo real
   (Supabase) e em modo demonstração (localStorage).
   ============================================================ */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var state = { profile: null, active: true, editingId: null };

  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }
  function lastRead(v) {
    try { if (v === undefined) return localStorage.getItem("bd_last_read"); localStorage.setItem("bd_last_read", v); } catch (e) {}
  }

  // ---------------- NAVEGAÇÃO ----------------
  var TITLES = {
    atrio: ["ÁTRIO", "Salve" + "."], corpus: ["CORPUS", "A biblioteca da Ordem"],
    acervo: ["MEU ACERVO", "O que você guardou"], oraculo: ["ORÁCULO", "Um ângulo, não um destino"],
    grimorio: ["GRIMÓRIO", "O seu registro"], reader: ["CORPUS", "Leitura"]
  };
  function setView(name) {
    $$(".view").forEach(function (v) { v.hidden = true; });
    var el = $("#view-" + name); if (el) el.hidden = false;
    $$("#nav button").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-view") === name); });
    var t = TITLES[name] || TITLES.atrio;
    $("#kicker").textContent = t[0];
    $("#pageTitle").textContent = name === "atrio" ? "Salve, " + firstName() + "." : t[1];
    $("#side").classList.remove("open");
    window.scrollTo(0, 0);
  }
  function firstName() { return (state.profile && state.profile.display_name || "Iniciado(a)").split(" ")[0]; }

  // ---------------- CORPUS ----------------
  function corpusById(id) { return window.BD_CORPUS.filter(function (c) { return c.id === id; })[0]; }

  function rowHTML(c) {
    var locked = c.tier === "iniciado" && !state.active;
    var tag = c.tier === "iniciado" ? '<span class="tag">GRAU II</span>' : "";
    var lockIco = locked
      ? '<span class="lock"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>'
      : '<span class="lock"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7b7568" stroke-width="1.4"><path d="M9 6l6 6-6 6"/></svg></span>';
    return '<div class="row" data-open="' + c.id + '">' +
      '<span class="num">' + esc(c.num) + '</span>' +
      '<span class="rt"><span class="tt">' + esc(c.title) + tag + '</span>' +
      '<span class="mm">' + esc(c.kind) + ' · ' + c.minutes + ' MIN</span></span>' +
      lockIco + '</div>';
  }
  function renderCorpus() {
    $("#corpusList").innerHTML = window.BD_CORPUS.map(rowHTML).join("");
    $("#atrioCorpus").innerHTML = window.BD_CORPUS.slice(0, 4).map(rowHTML).join("");
    $("#corpusHint").textContent = window.BD_CORPUS.length + " textos";
    $("#corpusCount").textContent = window.BD_CORPUS.length + " TEXTOS";
  }

  async function openReader(id) {
    var c = corpusById(id); if (!c) return;
    var locked = c.tier === "iniciado" && !state.active;
    lastRead(id);
    if (BD_STORE.getProgress(id) < 5) BD_STORE.setProgress(id, 8);
    var saved = await BD_STORE.inAcervo(id);

    var bodyHTML;
    if (locked) {
      bodyHTML = '<div class="gate"><div class="g-k">GRAU II · INICIADO</div>' +
        '<p>Este texto é reservado aos membros em dia. Ative a sua membresia para atravessar.</p>' +
        '<a class="btn-gold" href="planos.html" style="text-decoration:none">VER OS GRAUS</a></div>';
    } else {
      bodyHTML = '<div class="body">' + c.body.map(function (p, i) {
        if (p === "...") return "";
        return '<p class="' + (i === 0 ? "lead" : "") + '">' + esc(p) + "</p>";
      }).join("") + '<div class="rule-c"><span class="ln"></span><span class="d"></span><span class="ln r"></span></div></div>';
    }

    $("#reader").innerHTML =
      '<button class="back" id="readerBack"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 6l-6 6 6 6"/></svg> VOLTAR AO CORPUS</button>' +
      '<div class="rk">' + esc(c.kind) + '</div>' +
      '<h1>' + esc(c.title) + '</h1>' +
      '<div class="meta">' + esc(c.num) + ' · ' + c.minutes + ' MIN DE LEITURA</div>' +
      bodyHTML +
      (locked ? "" :
        '<div class="actions">' +
        '<button class="btn-ghost" id="saveBtn">' + (saved ? "✓ NO ACERVO" : "SALVAR NO ACERVO") + '</button>' +
        '<button class="btn-quiet" id="readBtn">MARCAR COMO LIDO</button></div>');

    setView("reader");
    $("#pageTitle").textContent = c.title;

    $("#readerBack").addEventListener("click", function () { setView("corpus"); });
    if (!locked) {
      $("#saveBtn").addEventListener("click", async function () {
        var r = await BD_STORE.addAcervo({ item_type: "corpus", item_ref: c.id, title: c.title });
        if (r && r.duplicate) { toast("Já estava no seu acervo."); }
        else { this.textContent = "✓ NO ACERVO"; toast("Guardado no acervo."); refreshCounts(); }
      });
      $("#readBtn").addEventListener("click", function () { BD_STORE.setProgress(c.id, 100); toast("Marcado como lido."); renderResume(); });
    }
  }

  // ---------------- ÁTRIO (resume + counts) ----------------
  function renderResume() {
    var id = lastRead() || window.BD_CORPUS[0].id;
    var c = corpusById(id) || window.BD_CORPUS[0];
    var pct = BD_STORE.getProgress(c.id) || 0;
    $("#resumeTitle").textContent = c.title;
    $("#resumeDesc").textContent = c.kind + " — " + c.excerpt;
    $("#resumeBar").style.width = pct + "%";
    $("#resumeCard").setAttribute("data-open", c.id);
  }
  async function refreshCounts() {
    var ac = await BD_STORE.listAcervo(); $("#acervoCount").textContent = ac.length + " ITENS";
    var gr = await BD_STORE.listGrimorio(); $("#grimCount").textContent = gr.length + " ENTRADAS";
  }

  // ---------------- ACERVO ----------------
  async function renderAcervo() {
    var list = await BD_STORE.listAcervo();
    if (!list.length) { $("#acervoList").innerHTML = '<div class="empty">Seu acervo está vazio. Salve textos do Corpus ou fragmentos do Oráculo para guardá-los aqui.</div>'; return; }
    $("#acervoList").innerHTML = list.map(function (it) {
      var kind = it.item_type === "oraculo" ? "FRAGMENTO DO ORÁCULO" : "TEXTO DO CORPUS";
      return '<div class="row" data-acervo="' + esc(it.id) + '" data-type="' + esc(it.item_type) + '" data-ref="' + esc(it.item_ref || "") + '">' +
        '<span class="num"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9ab6e" stroke-width="1.4"><path d="M5 5l7-2 7 2v10c0 3-3 5-7 6-4-1-7-3-7-6z"/></svg></span>' +
        '<span class="rt"><span class="tt">' + esc(it.title) + '</span><span class="mm">' + kind + '</span></span>' +
        '<button class="btn-quiet" data-remove="' + esc(it.id) + '">REMOVER</button></div>';
    }).join("");
  }

  // ---------------- ORÁCULO ----------------
  var lastReading = null;
  function drawOracle() {
    var q = $("#oracleQ").value;
    var r = window.BD_ORACLE.draw(q);
    lastReading = r;
    $("#oracleOut").innerHTML =
      '<div class="reading"><div class="src">' + esc(r.source) + '</div>' +
      '<blockquote>' + esc(r.quote) + '</blockquote>' +
      '<div class="interp">' + esc(r.interpretation) + '</div>' +
      '<div class="foot"><button class="btn-ghost" id="oracleSave">GUARDAR NO ACERVO</button>' +
      '<button class="btn-quiet" id="oracleAgain">TIRAR OUTRO</button></div></div>';
    $("#oracleSave").addEventListener("click", async function () {
      await BD_STORE.addAcervo({ item_type: "oraculo", item_ref: "orc_" + Date.now(), title: lastReading.quote });
      toast("Fragmento guardado."); refreshCounts();
    });
    $("#oracleAgain").addEventListener("click", drawOracle);
  }

  // ---------------- GRIMÓRIO ----------------
  async function renderGrim() {
    var list = await BD_STORE.listGrimorio();
    if (!list.length) { $("#grimList").innerHTML = '<div class="empty" style="padding:26px;font-size:16px">Nenhuma entrada ainda.</div>'; return; }
    $("#grimList").innerHTML = list.map(function (e) {
      var d = new Date(e.updated_at); var ds = isNaN(d) ? "" : d.toLocaleDateString("pt-BR");
      return '<div class="entry" data-grim="' + esc(e.id) + '"><div class="et">' + esc(e.title || "(sem título)") + '</div>' +
        '<div class="ed">' + ds + '</div><div class="ex">' + esc(e.body || "") + '</div></div>';
    }).join("");
  }
  function grimClear() { state.editingId = null; $("#grimTitle").value = ""; $("#grimBody").value = ""; }
  async function grimSave() {
    var title = $("#grimTitle").value.trim(), body = $("#grimBody").value.trim();
    if (!title && !body) { toast("Escreva algo antes de guardar."); return; }
    await BD_STORE.saveGrimorio({ id: state.editingId, title: title || "(sem título)", body: body });
    toast(state.editingId ? "Entrada atualizada." : "Entrada guardada.");
    grimClear(); await renderGrim(); refreshCounts();
  }

  // ---------------- BOOT ----------------
  async function boot() {
    state.profile = await window.BD.requireAuth();
    if (!state.profile) return; // requireAuth já redirecionou
    state.active = await window.BD.isMemberActive();

    // identidade
    $("#whoName").textContent = state.profile.display_name || "Membro";
    $("#avatar").textContent = (state.profile.display_name || "M").trim().charAt(0).toUpperCase();
    var st = state.active;
    $("#whoStatus").textContent = st ? "● EM DIA" : "● PENDENTE";
    $("#whoStatus").className = "st " + (st ? "active" : "inactive");
    $("#statusPill").className = "pill " + (st ? "active" : "inactive");
    $("#pillText").textContent = st ? "EM DIA" : "PENDENTE";

    // aviso de modo demonstração
    if (BD_STORE.demo) {
      document.body.classList.add("has-flag");
      var f = document.createElement("div");
      f.className = "demo-flag";
      f.textContent = "MODO DEMONSTRAÇÃO · seus dados ficam salvos só neste navegador. Ligue o Supabase (README) para o acesso real.";
      document.body.insertBefore(f, document.body.firstChild);
    }

    renderCorpus(); renderResume(); await refreshCounts();

    // navegação
    $("#nav").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-view]"); if (!b) return;
      var v = b.getAttribute("data-view");
      setView(v);
      if (v === "acervo") renderAcervo();
      if (v === "grimorio") renderGrim();
    });
    // atalhos (tiles / "ver tudo")
    document.addEventListener("click", function (e) {
      var j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); var v = j.getAttribute("data-jump"); setView(v); if (v === "acervo") renderAcervo(); if (v === "grimorio") renderGrim(); return; }
      var openEl = e.target.closest("[data-open]"); if (openEl) { openReader(openEl.getAttribute("data-open")); return; }
      var rm = e.target.closest("[data-remove]"); if (rm) { e.stopPropagation(); BD_STORE.removeAcervo(rm.getAttribute("data-remove")).then(function () { renderAcervo(); refreshCounts(); toast("Removido do acervo."); }); return; }
      var acv = e.target.closest("[data-acervo]"); if (acv && acv.getAttribute("data-type") === "corpus") { openReader(acv.getAttribute("data-ref")); return; }
      var ent = e.target.closest("[data-grim]"); if (ent) { loadGrim(ent.getAttribute("data-grim")); return; }
    });

    $("#resumeBtn").addEventListener("click", function () { openReader($("#resumeCard").getAttribute("data-open")); });
    $("#oracleDraw").addEventListener("click", drawOracle);
    $("#grimSave").addEventListener("click", grimSave);
    $("#grimClear").addEventListener("click", grimClear);
    $("#grimNew").addEventListener("click", function () { grimClear(); $("#grimTitle").focus(); });
    $("#logout").addEventListener("click", function () { window.BD.signOut ? window.BD.signOut() : (location.href = "index.html"); if (BD_STORE.demo) location.href = "index.html"; });
    $("#menuBtn").addEventListener("click", function () { $("#side").classList.toggle("open"); });
  }

  async function loadGrim(id) {
    var list = await BD_STORE.listGrimorio();
    var e = list.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    state.editingId = e.id; $("#grimTitle").value = e.title || ""; $("#grimBody").value = e.body || "";
    $("#grimBody").focus();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
