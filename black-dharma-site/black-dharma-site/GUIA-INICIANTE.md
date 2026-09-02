# O essencial pra você — criar sites e cuidar deles com segurança

Um guia curto, sem jargão. Leia uma vez, volte quando precisar. A ideia não é te transformar em programador da noite pro dia, é te dar o **mapa** para melhorar com segurança.

---

## 1. Um site tem duas metades

**A frente (front-end)** é tudo que abre no navegador de quem visita: o visual, os textos, os botões. São os arquivos `.html`, `.css` e `.js` deste projeto. Regra que muda tudo: **a frente é pública**. Qualquer visitante pode clicar com o botão direito, "ver código-fonte", e ler cada arquivo da frente. Então **nada secreto pode viver na frente**.

**O fundo (back-end)** é o que roda longe do visitante: o banco de dados, as senhas guardadas, as chaves secretas, a cobrança. É onde os segredos ficam. Neste projeto, o Supabase é o seu fundo pronto — ele já cuida das partes difíceis e perigosas (guardar senha do jeito certo, criar sessões, confirmar e-mail). Você **não** deve inventar isso do zero: segurança caseira é onde iniciantes se machucam.

> A pergunta que resolve 90% das dúvidas de segurança: **"isso é secreto?"** Se for, vai pro fundo. Se puder ser público, pode ficar na frente.

---

## 2. As 7 regras de ouro (cole na parede)

1. **Segredo nenhum na frente.** Chave `service_role`, token do Mercado Pago, senha de banco — nunca dentro de um arquivo `.html`/`.js`. Só a chave pública `anon`.
2. **A segurança mora no banco, não no visual.** Esconder um botão não protege dado nenhum. Quem protege é o **RLS** (as regras do `schema.sql`), que decide linha por linha quem vê o quê. Sempre pense: "se alguém digitar o endereço direto, o banco ainda protege?"
3. **Nunca confie no que vem do navegador.** O papel de admin, o "está pago", o preço — sempre confirmados no servidor/banco, nunca aceitos porque o site mandou.
4. **HTTPS sempre.** O cadeado. Hospedagens como Netlify/Vercel dão de graça. Sem ele, senhas viajam abertas.
5. **Senha forte e 2FA na SUA conta** (Supabase, GitHub, hospedagem, e-mail). Se invadem *você*, o site todo cai junto.
6. **`.env` fora do GitHub.** Segredos ficam em variáveis de ambiente, e o `.gitignore` impede que vazem sem querer. (O erro mais comum do mundo é subir uma chave secreta pro GitHub.)
7. **Atualize as bibliotecas.** Software velho tem buracos conhecidos. De vez em quando, atualize.

---

## 3. Como funciona o login (pra você não ter medo dele)

Você **nunca** vê nem guarda a senha do membro. O fluxo é: a pessoa digita a senha → o Supabase transforma numa "impressão digital" irreversível (hash) e compara → se bater, ele devolve um **token** (um crachá temporário) que fica no navegador dela → a cada visita, o site mostra o crachá em vez da senha. Confirmar e-mail, "esqueci a senha", expirar sessão — tudo isso o Supabase já faz. Seu trabalho é só **chamar** essas funções (é o que o `auth.js` faz) e **proteger as páginas** certas.

---

## 4. Como um administrador nasce com segurança

No seu site, ninguém consegue se declarar admin — nem editando o próprio perfil, nem mexendo no navegador. O papel é gravado pelo banco (`role = 'member'` no cadastro) e só muda por dentro do painel do Supabase, com um comando SQL que só **você** roda. Esse desenho — "o poder não se concede pelo lugar onde qualquer um entra" — é o mesmo princípio de discrição da própria Ordem. Guarde-o: **funções sensíveis nunca dependem de algo que o visitante controla.**

---

## 5. O que aprender, e nessa ordem

Não tente tudo de uma vez. Uma trilha que rende:

1. **HTML e CSS** — a estrutura e o visual. Você já tem exemplos bons nas suas próprias páginas; mexa nelas, quebre, conserte.
2. **JavaScript básico** — o que faz o site reagir. Foque em: pegar valores de um formulário, chamar uma função, mostrar uma mensagem.
3. **Como funciona a web** — o que é um domínio, DNS, HTTPS, o que é "front" e "back". Meia tarde de leitura muda tudo.
4. **Supabase a fundo** — Auth (login) e RLS (segurança). São seus dois superpoderes; dominá-los vale mais que aprender dez ferramentas.
5. **Git e GitHub** — guardar versões e publicar. Assusta no começo, vira segunda natureza.
6. **Só depois:** um framework (React), se e quando o projeto pedir. Você não precisa dele para começar.

Fontes boas e gratuitas: **MDN** (a enciclopédia da web), a **documentação do Supabase**, e **freeCodeCamp**. Pergunte-me em qualquer etapa — eu explico no seu nível e no contexto do *seu* site, que é como se aprende mais rápido.

---

## 6. Hábitos que separam amador de profissional

Faça **backup** (o Supabase tem; ative). Tenha um ambiente de **teste** separado do site no ar, para não quebrar o que os membros usam. Leia os **erros** com calma — quase sempre eles dizem o que fazer. Mude **uma coisa de cada vez** e teste. E desconfie de pressa: a maioria das falhas de segurança nasce de um atalho ("depois eu arrumo", "só dessa vez coloco a chave aqui").

---

*Você não precisa saber tudo para começar bem — precisa saber onde estão os perigos e pedir ajuda no ponto certo. O resto vem com a prática.*
