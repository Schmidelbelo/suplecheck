export interface FaqItem {
  question: string;
  answer: string;
}

export const homeFaq: FaqItem[] = [
  {
    question: "O SupleScore vende suplementos?",
    answer:
      "Não. O SupleScore não vende produtos. Somos uma plataforma independente de comparação: analisamos rótulos, composição e preço para ajudar você a decidir — a compra sempre acontece na loja de sua escolha.",
  },
  {
    question: "Como o Índice SupleScore é calculado?",
    answer:
      "O Índice combina seis critérios objetivos e verificáveis — custo-benefício, transparência do rótulo, preço por dose, reputação, promessas exageradas de marketing e confiabilidade da loja — em uma nota única de 0 a 100, cada um com peso público. O detalhamento completo está na página de Metodologia.",
  },
  {
    question: "Vocês recebem das marcas para aparecer bem no ranking?",
    answer:
      "Não. Marcas não pagam para ter nota melhor nem para aparecer em posições mais altas. Alguns links podem ser de afiliados (explicado em 'Como ganhamos dinheiro'), mas isso nunca influencia o cálculo do Índice.",
  },
  {
    question: "Com que frequência o ranking é atualizado?",
    answer:
      "Reavaliamos preços com frequência e revisamos a composição sempre que uma marca altera a fórmula ou o rótulo de um produto. Cada nota exibe a data do último cálculo.",
  },
  {
    question: "Posso sugerir um produto para ser avaliado?",
    answer:
      "Sim. Use a página de Contato para enviar sugestões de produtos ou marcas — elas entram na fila de curadoria.",
  },
];
