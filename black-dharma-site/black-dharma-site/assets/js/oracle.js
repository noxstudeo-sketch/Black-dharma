/* ============================================================
   BLACK DHARMA — Oráculo literário
   Divinação contemplativa, não preditiva: sorteia um fragmento e
   oferece uma interpretação para pensar, não uma profecia.
   Fragmentos e fontes são autorais (da Ordem) — sem atribuição a
   pessoas reais. Funciona 100% offline, sem chave de API.
   (Numa etapa futura, dá para trocar por uma leitura gerada por IA
    via Edge Function — sempre no servidor, nunca com a chave no site.)
   ============================================================ */
window.BD_ORACLE = (function () {
  var F = [
    { q: "A porta que você evita é a que leva ao seu quarto.", s: "Do Corpus, tratado VII", i: "O que você adia encarar costuma ser exatamente o centro da questão. Repare no que a pergunta contorna sem tocar." },
    { q: "O que se apressa chega incompleto.", s: "Sentenças do Limiar", i: "Há uma tentação de resolver agora. O tempo que parece perdido na espera é, muitas vezes, o próprio trabalho amadurecendo." },
    { q: "Aquilo que te irrita no outro dorme em ti.", s: "Espelhos, fragmento III", i: "Se há uma pessoa no fundo desta questão, a intensidade da sua reação é um mapa — aponta para algo seu, não só dela." },
    { q: "Não peças o caminho a quem nunca saiu de casa.", s: "Ditos da Custódia", i: "Cuidado de quem você aceita conselho neste assunto. Nem toda voz confiante já atravessou o que você atravessa." },
    { q: "A brasa vence a fogueira porque dura.", s: "Da Disciplina e da Vontade", i: "A resposta aqui não é um gesto grandioso, é constância. O pequeno passo repetido move mais do que o salto único." },
    { q: "Guarda silêncio e verás o que o ruído escondia.", s: "Sentenças do Limiar", i: "Talvez você já saiba a resposta e o barulho externo a esteja abafando. Recolha-se antes de decidir." },
    { q: "Toda queda que escolhes é uma separação que te faz.", s: "Sobre o Arquétipo da Queda", i: "Um rompimento que assusta pode ser justamente o passo que te individualiza. Separar-se dói e, às vezes, é o caminho." },
    { q: "O mapa não é o território; a dúvida, sim.", s: "Correspondências, glosa", i: "Não confunda a sua ideia da situação com a situação. Volte ao concreto: o que, de fato, está diante de você?" },
    { q: "O que negas organiza-se nas sombras.", s: "Espelhos, fragmento I", i: "Aquilo que você finge não sentir não desaparece — age por trás. Nomeie o que evita nomear e ele perde poder." },
    { q: "Duas portas: a fácil mente, a difícil ensina.", s: "Ditos da Custódia", i: "Entre duas saídas, a que exige mais de você costuma ser a que te transforma. A facilidade aqui pode ser uma armadilha." },
    { q: "Chama pelo nome certo e a coisa obedece.", s: "Da Linguagem das Correspondências", i: "Precisão importa. Talvez a questão só se resolva quando você nomear com exatidão o que realmente quer — sem eufemismo." },
    { q: "Quem quer tudo ao mesmo tempo não quer nada.", s: "Da Disciplina e da Vontade", i: "Vontade é direção mantida. Escolha uma coisa e abra mão das concorrentes; a dispersão é o verdadeiro obstáculo." },
    { q: "O guardião do umbral tem o teu rosto.", s: "Do Corpus, tratado VII", i: "O obstáculo que você atribui ao mundo pode ter forma interna. Pergunte-se onde você é, também, o próprio impedimento." },
    { q: "A paciência é uma forma de força que não faz barulho.", s: "Sentenças do Limiar", i: "Sustentar sem agir é, agora, o ato mais forte. Nem toda espera é passividade — algumas são domínio." },
    { q: "Não construas telhado antes das fundações.", s: "Ditos da Custódia", i: "Há um passo anterior sendo pulado. Verifique a base antes de avançar para o efeito visível." },
    { q: "O que se dá de graça é esquecido no mesmo dia.", s: "Sobre o Silêncio", i: "Aquilo que você conquista com custo, você guarda. Desconfie do que chega sem exigir nada de você nesta questão." }
  ];

  // Sorteio pseudo-aleatório com um leve peso da pergunta (para dar a
  // sensação de resposta "sua", sem fingir previsão).
  function pick(question) {
    var seed = Date.now() % 100000;
    for (var k = 0; k < (question || "").length; k++) seed += question.charCodeAt(k) * (k + 7);
    var idx = Math.abs(Math.floor(seed + Math.random() * F.length)) % F.length;
    return F[idx];
  }

  function draw(question) {
    var f = pick(question);
    var closing = question && question.trim().length > 3
      ? "Leve isto à sua pergunta — não como sentença, mas como ângulo: o que muda se você olhar por aqui?"
      : "Formule uma pergunta e volte a tirar: o oráculo responde melhor a quem chega com uma questão nítida.";
    return {
      source: f.s,
      quote: f.q,
      interpretation: f.i + " " + closing
    };
  }

  return { draw: draw, size: F.length };
})();
