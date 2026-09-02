# Black Dharma — site da Ordem

Portal de membros de uma ordem esotérica discreta. Frente feita em HTML/CSS/JS puro; autenticação, banco de dados e segurança pelo **Supabase**; pagamentos (etapa futura) pelo **Mercado Pago**.

> **Onde você está:** entregues a **Etapa 1** (identidade, login, cadastro, segurança) e a **Etapa 2** (área do membro funcional: ler o corpus, salvar no acervo, grimório pessoal, oráculo, recuperação de senha). Painel do admin e pagamentos vêm nas próximas etapas (ver o roadmap no fim).

---

## O que tem aqui

```
black-dharma-site/
├─ index.html            # Login (Portal de Acesso)
├─ cadastro.html         # Solicitar iniciação (registro)
├─ painel.html           # Área do membro (átrio, corpus, acervo, oráculo, grimório)
├─ recuperar.html        # Pedir recuperação de senha
├─ nova-senha.html       # Definir nova senha (vindo do e-mail)
├─ assets/
│  ├─ css/app.css        # Estilo da área de membro (Templo austero)
│  └─ js/
│     ├─ supabase.js     # Conexão — só chaves PÚBLICAS entram aqui
│     ├─ auth.js         # login, cadastro, sessão, proteção de página
│     ├─ corpus.js       # o conteúdo de leitura da Ordem
│     ├─ oracle.js       # oráculo literário (offline, sem API)
│     ├─ store.js        # dados: Supabase quando ligado, senão localStorage
│     └─ painel.js       # lógica da área do membro
├─ db/
│  ├─ schema.sql         # Etapa 1: perfis + papéis + RLS  ← segurança
│  └─ schema-etapa2.sql  # Etapa 2: acervo + grimório (RLS de linha própria)
├─ .env.example          # Modelo de variáveis (copie para .env)
├─ .gitignore
├─ README.md             # este arquivo
└─ GUIA-INICIANTE.md     # leitura curta: o essencial pra você crescer
```

**Funciona ao abrir, sem configurar nada.** Dê dois cliques em `index.html`, coloque qualquer e-mail/senha e clique em *Entrar na Ordem*: você cai na área do membro em **modo demonstração** — lê os textos, salva no acervo, tira o oráculo e escreve no grimório, e tudo fica guardado **no seu navegador**. Ao ligar o Supabase, os mesmos botões passam a usar o banco real (com login e segurança de verdade).

---

## Ligar de verdade (uma vez, ~20 min)

1. **Crie uma conta no Supabase** (gratuito) em supabase.com e crie um projeto. Anote a região mais perto do Brasil.
2. **Rode o banco:** no Supabase, abra **SQL Editor → New query**, cole todo o `db/schema.sql` e clique **Run**; depois faça o mesmo com `db/schema-etapa2.sql`. Isso cria as tabelas (perfis, papéis, acervo, grimório) e liga a segurança.
3. **Pegue as chaves públicas:** **Project Settings → API**. Copie *Project URL* e *anon key*.
4. **Cole no site:** abra `assets/js/supabase.js` e substitua os dois valores no topo (`SUPABASE_URL` e `SUPABASE_ANON_KEY`).
5. **Confirmação de e-mail:** em **Authentication → Providers → Email**, deixe *Confirm email* ligado (mais seguro).
6. **Teste:** abra `cadastro.html`, crie um usuário, confirme pelo e-mail, e entre pelo `index.html`.
7. **Vire o primeiro admin:** no SQL Editor, rode (com o seu e-mail):
   ```sql
   update public.profiles set role = 'admin' where email = 'seu-email@exemplo.com';
   ```

> Você **não** consegue se tornar admin pelo site — só pelo painel do Supabase. Isso é de propósito: é o que impede que um membro comum se promova sozinho.

---

## Publicar na internet (quando quiser)

Hospede a pasta como site estático — **Netlify**, **Vercel** ou **Cloudflare Pages** (todos têm plano grátis e dão **HTTPS** automático, que é obrigatório). Basta arrastar a pasta ou conectar um repositório do GitHub. Nada de segredo vai junto — o `.env` fica de fora pelo `.gitignore`.

---

## Regras de ouro de segurança (não quebre nenhuma)

- **Nunca** coloque a chave `service_role` do Supabase nem o token do Mercado Pago em nenhum arquivo do site. Só chave pública `anon` no front.
- **Sempre** rode o `schema.sql` — sem o RLS, a chave pública abriria o banco inteiro.
- **Nunca** confie no visual para proteger dados. Esconder um botão não protege nada; quem protege é o RLS no banco.
- **Sempre** use HTTPS em produção.
- Papel de admin só se concede pelo painel do Supabase, nunca pelo site.

Explicação sem jargão está no **GUIA-INICIANTE.md**.

---

## Roadmap — as próximas etapas

- **Etapa 1 (feita):** identidade, login, cadastro, banco + papéis + RLS.
- **Etapa 2 (feita):** área do membro funcional — átrio, leitura do corpus, acervo pessoal, grimório, oráculo literário, e recuperação de senha. Roda em modo demo (localStorage) e em modo real (Supabase).
- **Etapa 3 — Painel do administrador:** `admin.html` (só role `admin`, garantido pelo RLS): ver membros, status, promover/gerir, publicar conteúdo do corpus.
- **Etapa 4 — Pagamentos:** `planos.html` + planos mensal/anual pelo Mercado Pago via uma Edge Function + webhook que escreve o `status` da membresia (aqui entram os segredos, sempre no servidor).
- **Etapa 5 — Loja e app:** produtos digitais/físicos e versão instalável (PWA).

Peça a próxima etapa quando quiser seguir.
