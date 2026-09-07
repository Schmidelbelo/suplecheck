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

/**
 * FAQ estendida, exclusiva de `/faq` — nunca reaproveitada na Home (que
 * já tem `homeFaq` com seu próprio `FAQPage` JSON-LD) para não duplicar
 * o mesmo schema em duas URLs. Todo item aqui é consistente com o que
 * já está documentado nas páginas institucionais correspondentes —
 * nenhuma resposta nova inventada, só consolidada em um único lugar.
 */
export const extendedFaq: FaqItem[] = [
  ...homeFaq,
  {
    question: "O SupleScore substitui a orientação de um médico ou nutricionista?",
    answer:
      "Não. O Índice compara produtos entre si — composição, transparência de rótulo e preço —, não avalia se um suplemento é adequado à sua saúde ou objetivo individual. Consulte um profissional antes de começar a usar qualquer suplemento. Detalhes em Aviso Médico e Científico.",
  },
  {
    question: "O que acontece quando um dado de um produto está errado?",
    answer:
      "Corrigimos assim que o erro é verificado contra a fonte original — nunca editamos a nota antiga, geramos um novo cálculo com data própria, preservando o histórico anterior visível na página do produto. Ver Política de Correções.",
  },
  {
    question: "Quem decide o que entra no catálogo?",
    answer:
      "A curadoria editorial (o que entra, quais fatos coletar) é separada de quem negocia programas de afiliado — nenhuma das duas aprova o trabalho da outra. Ver Independência Editorial.",
  },
  {
    question: "De onde vêm os dados de cada produto?",
    answer:
      "Rótulo/página oficial do fabricante para composição, literatura científica para faixas de dosagem eficaz, e captura periódica de preço real na loja. Cada fonte é detalhada em Fontes Utilizadas.",
  },
];
