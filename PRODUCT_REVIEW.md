# PRODUCT_REVIEW.md

Auditoria de experiência do produto — SupleScore
Papel: Head de Produto / UX Designer / SEO & Conversão
Metodologia: leitura direta do código-fonte real (copy, componentes, tokens visuais, metadata) simulando a chegada de um visitante vindo do Google buscando "qual a melhor creatina", "creatina vale a pena", "melhor creatina custo benefício".

Nenhuma alteração de código foi feita nesta etapa. Este documento é só diagnóstico.

---

## Achado transversal (antes de entrar por página)

Antes de avaliar página por página, um problema estrutural que atravessa **toda** a copy institucional do site precisa ser registrado primeiro, porque ele invalida parcialmente a análise de "confiança" em todas as seções abaixo:

> **A copy de marketing (Hero, Como Funciona, Índice Explicado, Como Avaliamos, FAQ) descreve uma metodologia de 4 critérios — "Pureza da composição" (peso 35%), "Dosagem por porção" (30%), "Transparência do rótulo" (20%) e "Custo-benefício" (15%) — que não é a metodologia real implementada.** A metodologia que de fato calcula as notas hoje usa 6 critérios diferentes, com pesos diferentes: Custo-benefício (25%), Preço por dose (15%), Transparência do rótulo (25%), Reputação (15%), Promessas exageradas (10%), Confiabilidade da loja (10%). Não existe nenhum critério real de "pureza da composição" (implicaria teste laboratorial de contaminantes, que não é feito) nem de "dosagem por porção" isolado (o critério real de dosagem está embutido em "custo-benefício", não é autônomo).

Isso não é um detalhe de copywriting — é a promessa central do produto ("critérios públicos, documentados, sem caixa-preta") sendo tecnicamente falsa no estado atual. Qualquer usuário técnico, jornalista ou concorrente que comparar a home com `/metodologia` ou com o breakdown real em `/creatina/[slug]` vai encontrar a inconsistência em menos de um minuto. Este achado é referenciado como **[MISMATCH]** nas seções abaixo sempre que reaparecer, e está listado como prioridade **Alta #1** na tabela final.

---

## 1. Home

**Hero.**

- Badge: "Comparação independente de suplementos"
- H1: **"Escolha suplementos com dados, não com marketing"**
- Subheadline: "O SupleScore avalia composição, pureza e custo-benefício de cada produto e resume tudo em uma nota única: o Índice SupleScore. Sem publicidade paga influenciando o resultado." _(menciona "pureza" — [MISMATCH])_
- CTA primário: "Ver o ranking" → `/ranking` (redireciona corretamente para `/creatina`)
- CTA secundário: "Como avaliamos"
- Microcopy de confiança: "Metodologia pública · Sem venda de posição no ranking"

**Primeira impressão.** Visualmente forte — badge, headline com destaque de cor na palavra "dados", gradiente sutil de marca no fundo. O problema não é estético, é de **veracidade de promessa**: a headline promete "dados", mas a primeira prova concreta de dado real (o ranking) só aparece a partir da 6ª seção da home (`RankingPreview`), e quando aparece, **está mostrando skeletons vazios com a badge "🔒 Em preparação"** — mesmo havendo 10 produtos reais, avaliados, rankeados, vivos em `/creatina`. Um visitante que rola a página até essa seção conclui ativamente que o produto não existe ainda. Essa é a falha de primeira impressão mais grave do site.

**Clareza.** O H1 é sobre a categoria de produto genérica ("suplementos"), não sobre a intenção de busca real do visitante ("qual a melhor creatina"). Quem chega do Google buscando "melhor creatina custo benefício" não vê a palavra "creatina" em nenhum lugar até rolar a página — não no H1, não na primeira dobra.

**Copy.** Boa qualidade de escrita, tom direto e sóbrio (nada de "revolucionário", "disruptivo"), consistente com o posicionamento de "fonte confiável e sóbria" — isso é um acerto real de tom de voz. O problema é factual ([MISMATCH]), não estilístico.

**Hierarquia visual.** Sequência de seções é logicamente correta para um visitante que **já confia** no produto (Hero → Problema → Como Funciona → Índice → Critérios → Benefícios → Ranking → Newsletter → FAQ → CTA final), mas para um visitante cético chegando de busca comercial, a prova concreta (o ranking real) está posicionada tarde demais e, quando chega, é a única seção falsa de todas.

**CTA.** Múltiplos CTAs concorrendo por atenção ao longo da página, mas o de **maior destaque persistente** (no Navbar, presente em toda página, todo scroll) é **"Receber ranking"**, que leva para captura de e-mail (`/#newsletter`) — não para o ranking em si, que já existe e está pronto para ser mostrado. Isso é o oposto do funil correto para um produto que já tem conteúdo real: mostrar valor primeiro, pedir e-mail depois.

**Tempo até o usuário entender o produto.** Quem lê a home inteira até o fim entende bem o conceito (nota única, metodologia pública, sem venda de posição). O problema é que a home **impede** o entendimento mais rápido possível, que seria: clicar em algo óbvio → ver o ranking real → entender tudo em 5 segundos, como já acontece hoje em `/creatina`. A home está, na prática, adicionando fricção entre o visitante e a prova mais forte que o produto tem.

---

## 2. Ranking (`/creatina`)

**Disposição dos cards.** Layout horizontal em linha (posição · imagem · nome/marca/variante · score+selo · preço/preço-por-dose · CTA "Ver detalhes"), em pilha vertical de 10 itens. Estrutura correta e comum para ranking comparativo (mesma lógica do Wirecutter/RTINGS: uma linha = um produto, hierarquia horizontal de informação).

**Legibilidade.** Boa — posição numerada grande à esquerda, nome com marca acima em uppercase pequeno (bom padrão de hierarquia tipográfica), score em número grande com badge de classificação colorida ao lado. `text-2xl font-bold tabular-nums` no score garante alinhamento numérico correto entre linhas (detalhe técnico bem cuidado).

**Confiança.** Aqui, ao contrário da home, a confiança funciona: número + selo colorido + "gerado em [data]" no topo da lista comunica "isso é medido, não é opinião". É a melhor peça de UX de confiança do produto inteiro hoje.

**Comparação.** Fraca. Os 10 cards estão em ordem fixa por score, sem nenhum controle de reordenação ou filtro (preço, preço por dose, marca). Para 10 itens isso é tolerável — o usuário consegue escanear tudo em uma tela — mas não há como responder rapidamente "qual a mais barata?" ou "só me mostra as da marca X" sem ler os 10 cards manualmente.

**Informações faltantes na própria página de ranking (não no card, na página como um todo):**

- Nenhuma explicação de _como ler a nota_ nesta página específica — quem chega direto em `/creatina` via link/busca, sem ter passado pela home, vê "92.2" e um selo "Excelente" sem nenhum link contextual explicando o que é o Índice SupleScore antes de precisar ir a outra página.
- Nenhum contador tipo "10 produtos avaliados" reforçando volume/atualidade.
- Nenhuma indicação de "atualizado em [data]" fora do topo (fácil de perder ao rolar).

**Excesso de informação.** Nenhum — ao contrário, a página está enxuta demais no nível "explicação", não no nível "dado". Não há elemento supérfluo nos cards.

**Escaneabilidade.** Boa em desktop. Em telas pequenas os cards colapsam para coluna (`flex-col sm:flex-row`), o que é o padrão certo, mas a página de listagem (`/creatina/page.tsx`) **não tem nenhuma classe responsiva própria** além do que herda do `RankingEntryCard` — o espaçamento entre seções e a introdução textual não foram especificamente ajustados para mobile, apenas herdam o comportamento padrão do `Section`/`Container`. Funciona, mas não foi desenhado pensando em mobile-first, que é onde a maior parte do tráfego de busca "melhor creatina" chega.

---

## 3. Página do Produto (`/creatina/[slug]`)

**Confiança.** Estrutura de informação é a correta e reconhecível (score grande no topo → explicação em texto → critérios detalhados com barra de progresso → histórico → dados técnicos → CTA de compra) — segue o padrão que sites de review sérios usam. O selo de classificação (`Badge` colorido) reaparece de forma consistente com a página de listagem, boa continuidade visual.

**Explicação do Score.** Existe uma frase gerada automaticamente ("Este produto recebeu nota X, classificação Y. O critério que mais influenciou a nota foi Z...") — é funcional, mas é geração mecânica simples (maior peso×score), não uma explicação editorial. Para um produto que promete ser "mais do que um número", essa frase única é rasa perto do que a metodologia real calcula (6 critérios, com notas técnicas por critério — `note.message` — que já existem no dado mas **não aparecem resumidos na explicação principal**, só depois, dentro de cada card de critério).

**Critérios.** Bem apresentados individualmente: nome, peso (%), nota, barra de progresso, notas técnicas quando existem. Ordenados por peso — decisão correta (o que mais importa aparece primeiro). Ponto fraco: **os nomes dos 6 critérios reais aqui (Custo-benefício, Preço por dose, Transparência do rótulo, Reputação, Promessas exageradas, Confiabilidade da loja) nunca batem com os 4 critérios citados na home/FAQ/metodologia institucional** — [MISMATCH] reaparece exatamente no momento em que o usuário mais precisaria de consistência (o momento de decisão de compra).

**Metodologia.** A versão da metodologia (`v1.0.0`) aparece só no histórico de avaliação, nunca no bloco de critérios em si — um usuário não teria como saber, olhando só a seção "Critérios utilizados", que existe uma versão rastreável e datada por trás daquele cálculo específico.

**Facilidade de decisão.** Boa para quem já está na página certa: número, selo, preço, preço por dose, tudo visível sem scroll longo. Falta explicitamente **comparação com os concorrentes do ranking** — o usuário está isolado num produto, sem link de volta contextual tipo "comparar com os outros 2 melhores da categoria" ou "posição #3 de 10 no ranking".

**CTA.** "Ver oferta em {loja}" é o padrão certo (ação clara, nomeada, orientada a produto) — mas aponta para uma URL de exemplo fictícia (`amazon.com.br/dp/exemplo-...`), então tecnicamente **o CTA mais importante da página inteira não funciona de verdade**. O segundo botão, "Comparar outras lojas", está sempre desabilitado (`disabled`) — visualmente presente, funcionalmente morto, o que comunica "recurso quebrado" em vez de "recurso futuro" (não há tooltip/texto explicando por que está desabilitado).

**UX.** Seções bem divididas com `Section` consistente, uso de `Card` para agrupar dados técnicos. O maior ponto fraco de UX aqui não é a página em si, é a ausência de link de saída natural de volta ao ranking (nenhum breadcrumb visualmente destacado além do padrão pequeno do `PageHeader`, nenhum "ver outros produtos desta categoria" no rodapé da página).

---

## 4. Identidade Visual

**Cores.** Sistema de tokens bem construído: escala de marca verde (`brand-50` a `brand-950`), escala neutra completa, cores semânticas (success/warning/danger/info) mapeadas corretamente para os 5 tiers de classificação (Excelente/Bom = success, Regular = warning, Fraco/Não recomendado = danger). Verde como cor de marca é coerente com o mercado de suplementos/saúde/confiança, mas é também a cor mais comum do setor (baixa diferenciação visual frente a concorrentes do mesmo nicho).

**Tipografia.** Três famílias com papéis bem definidos: Inter (corpo de texto, `--font-sans`), Lexend (títulos/display, `--font-display`), Geist Mono (código/dados técnicos, `--font-mono`). Escolha de Lexend para display é interessante — fonte desenhada para legibilidade, comunica "clareza" de forma coerente com o posicionamento do produto ("dados, não marketing"). Escala tipográfica (`text-xs` a `text-6xl`) é completa e consistente.

**Espaçamento.** Escala de 4px bem definida (`--space-1` a `--space-32`), usada de forma consistente via classes utilitárias do Tailwind — não há evidência de valores "mágicos" soltos nos componentes revisados.

**Contraste.** Tokens semânticos (`--color-text`, `--color-text-muted`, `--color-text-subtle`) sobre fundos claros/escuros seguem a escala neutra 900/600/500 sobre 0/50 — dentro do esperado para WCAG AA em texto principal; texto `text-subtle` (neutral-500 sobre branco) é o ponto mais arriscado de contraste insuficiente em textos pequenos, mas não foi auditado com ferramenta de contraste real nesta revisão (recomendação, não constatação).

**Responsividade.** Inconsistente entre páginas: a página de listagem do ranking (`/creatina/page.tsx`) não tem nenhuma classe responsiva própria (depende 100% do que os componentes filhos já resolvem); a página de detalhe tem só 2 pontos de breakpoint explícitos (`md:grid-cols-[240px_1fr]` no cabeçalho do produto, `sm:grid-cols-3` nos dados técnicos); o `RankingEntryCard` é o componente mais bem cuidado nesse quesito (6 usos de `sm:` cobrindo empilhamento de imagem/texto/preço/CTA). Não há quebra visual óbvia esperada, mas também não há evidência de que mobile foi tratado como prioridade — para um produto cuja principal fonte de tráfego será busca orgânica em celular, isso é um risco silencioso.

**Consistência.** Alta entre os componentes de UI de baixo nível (Badge, Card, Button seguem o mesmo sistema de tokens em toda a base) — isso é um ativo real e vai facilitar qualquer evolução visual futura, porque a mudança acontece em um lugar (`tokens.css`) e se propaga.

---

## 5. Conversão

**O que impede hoje um visitante de clicar no botão Comprar?**

1. O botão de compra na página de detalhe leva a uma URL de exemplo fictícia — mesmo o usuário mais convencido não consegue completar a ação.
2. O CTA de maior destaque do site inteiro (Navbar) não leva ao produto, leva à captura de e-mail — o visitante nunca é conduzido, pelo caminho de maior fricção mínima, até um card de produto específico com botão de compra.
3. Não há nenhuma urgência ou diferenciação de oferta ("melhor preço encontrado", "3 lojas comparadas") — apenas um preço estático de uma única loja por produto, o que reduz a percepção de que "vale a pena clicar aqui em vez de pesquisar sozinho no Google".

**O que gera insegurança?**

1. O [MISMATCH] entre a metodologia anunciada (4 critérios, pesos específicos) e a metodologia real (6 critérios, pesos diferentes) — para qualquer usuário que cruze as duas fontes, é o tipo de inconsistência que destrói credibilidade de forma desproporcional ao tamanho do erro, porque a promessa central do produto é justamente "metodologia transparente e auditável".
2. Botão "Comparar outras lojas" sempre desabilitado sem explicação — comunica produto inacabado.
3. Ausência total de prova social (nenhum número de produtos avaliados, nenhuma menção de imprensa, nenhum contador de usuários, nenhum depoimento) — para um produto que se posiciona como "referência", zero prova social é uma lacuna de confiança clássica.
4. Seção da home "Ranking de creatinas — Em preparação" contradizendo o que existe de fato — inconsistência que, mais cedo ou mais tarde, algum visitante vai perceber e generalizar como "esse site não é atualizado / não é confiável".

**O que falta para parecer uma referência nacional?**

1. Volume — uma categoria com 10 produtos não sustenta a percepção de autoridade nacional; referências reais (Wirecutter, RTINGS) têm dezenas de categorias e centenas de produtos.
2. Prova de rigor visível na superfície — hoje o rigor existe no cálculo (motor de scoring real, histórico versionado, metodologia documentada), mas não é _comunicado_ de forma visível o suficiente na página onde a decisão acontece (o breakdown de critérios é bom, mas está a um scroll de distância, não é o primeiro elemento visto).
3. Qualquer menção de imprensa, especialista, ou parceria — hoje não há nenhum elemento de terceiros validando o produto.
4. Fotografia/imagem de produto real — hoje todos os 10 produtos usam o mesmo placeholder genérico (`creatina-placeholder.svg`), o que remove um dos sinais mais básicos de "isso foi realmente testado/comprado", mesmo sendo aceitável tecnicamente para MVP.

---

## 6. SEO

**Conteúdo.** Forte nas páginas institucionais (Metodologia, Como Avaliamos, Sobre — texto substancial e original), fraco nas páginas de produto/categoria, que são a superfície que precisa competir por "melhor creatina" nos resultados de busca. A página `/creatina` tem pouquíssimo texto original além da lista de produtos — não há um parágrafo introdutório rico em contexto (o que é creatina, como escolher, o que o índice considera) que ajude tanto SEO quanto o usuário que chega sem contexto algum.

**Títulos.** Home usa o título institucional genérico ("SupleScore — Comparação inteligente de suplementos"), sem a palavra "creatina" — para quem busca intenção comercial específica, a home nunca vai competir bem nesse termo. `/creatina` tem título correto e específico ("Ranking de Creatinas | SupleScore"), mas não captura variações de cauda longa de alta intenção como "melhor creatina" ou "creatina vale a pena" no `<title>` nem na meta description.

**Headings.** H1 da home não contém "creatina" nem "suplemento" de forma específica — é genérico por design (a home cobre a marca inteira, não uma categoria), o que é aceitável, mas significa que toda a carga de ranqueamento para os termos-alvo do usuário recai sobre `/creatina`, que por sua vez tem H1 correto ("Ranking de Creatinas") mas nenhum H2/H3 de apoio semântico (não há, por exemplo, um H2 "Como escolher a melhor creatina" ou "Creatina vale a pena?" respondendo diretamente às intenções de busca mencionadas no briefing).

**Arquitetura.** Estrutura de URL limpa e correta (`/creatina`, `/creatina/[slug]`), mas isolada — não existe ainda uma página de índice de categorias (`/categorias` está vazio) nem breadcrumbs visíveis de forma proeminente (existem via JSON-LD, mas não como elemento visual reforçando a hierarquia para o usuário).

**Clusters.** Inexistente. Não há conteúdo editorial (blog/artigos) linkando para `/creatina`, e a própria página de detalhe não linka para outros produtos do mesmo ranking nem para conteúdo relacionado ("o que é creatina", "como tomar creatina") — todo o cluster temático que normalmente sustenta ranqueamento de cauda longa está ausente.

**Links internos.** Fracos entre as páginas que mais importam: a home linka para `/como-avaliamos` e `/ranking`, mas `/creatina` e `/creatina/[slug]` não linkam de volta para `/metodologia`/`/como-avaliamos` de forma contextual (só existem no menu global) — perde-se a chance de reforçar relevância temática exatamente na página que mais precisa dela.

**Rich Snippets.** Maior oportunidade perdida do produto: existe um gerador de schema Product/Offer/AggregateRating já implementado no código, mas **não está sendo usado em nenhuma página real** — nem `/creatina/[slug]`, que é exatamente a página que deveria aparecer no Google com estrelas e preço no resultado de busca. Hoje só há `breadcrumbSchema` nas páginas de creatina. Isso é a diferença entre aparecer como um link azul comum ou aparecer como um resultado rico com nota e preço — a segunda opção converte substancialmente mais em CTR de busca orgânica.

**EEAT (Experience, Expertise, Authoritativeness, Trustworthiness).**

- _Expertise/Trust_: bem posicionado no papel — páginas de metodologia detalhadas, tom editorial sóbrio, ausência de "venda de posição no ranking" declarada.
- Mas prejudicado diretamente pelo [MISMATCH] (autoridade se constrói com precisão, não com contradição entre páginas do próprio site) e pela ausência de qualquer sinal de autoria humana (não há "quem somos", nome de responsável editorial, credenciais — `/sobre` existe mas precisa ser conferida quanto a isso especificamente).
- _Experience_: zero evidência de "nós compramos/testamos fisicamente" — todas as imagens são placeholder, o que é honesto tecnicamente mas enfraquece o sinal de "experiência real com o produto" que o Google (e o usuário) valoriza cada vez mais em conteúdo de review.

---

## 7. Benchmark

Comparando princípios (não visual) com Wirecutter, RTINGS, TechGearLab e PCPartPicker:

**O que esses sites fazem que o SupleScore ainda não faz:**

1. **Metodologia sempre visível a um clique da nota, nunca só em outra página institucional isolada.** RTINGS e Wirecutter colocam "como testamos isso" como link direto dentro do card/seção de cada critério, não apenas num menu global — o SupleScore já tem a página `/metodologia`, só falta a costura contextual.
2. **Comparação lado a lado como recurso central, não periférico.** PCPartPicker inteiro é organizado em torno de comparar N itens ao mesmo tempo; o SupleScore já tem o `CompareSupplementsUseCase` pronto no backend e zero superfície de uso — é a lacuna mais alinhada com esse padrão de benchmark e a mais barata de fechar (a lógica já existe).
3. **Consistência absoluta entre a nota mostrada e a explicação da nota.** Nenhum desses sites sobrevive à contradição que o SupleScore tem hoje entre marketing e produto — é a característica não-negociável desse tipo de site.
4. **Volume como sinal de autoridade.** Todos eles cobrem dezenas/centenas de itens por categoria antes de se apresentarem como referência — reforça a priorização de "mais produtos/categorias" no roadmap.
5. **Prova de manuseio físico do produto** (fotos próprias, não imagens de fabricante/placeholder) — RTINGS e Wirecutter fazem disso o centro da credibilidade visual.
6. **Ranqueamento reordenável pelo usuário** (por preço, por categoria de uso, por critério específico) — PCPartPicker e Wirecutter deixam o usuário reordenar a lista pelo que importa para ele, não só aceitar a ordem editorial.

**O que o SupleScore já faz bem, no mesmo padrão desses sites:**

- Nota única + explicação decomposta em critérios com peso (mesmo padrão RTINGS).
- Metodologia pública e versionada (mesmo princípio editorial do Wirecutter).
- Ausência de "posição paga" declarada explicitamente (mesmo compromisso editorial).

---

## Tabela de Priorização

| #   | Melhoria                                                                                                                                                                                  | Prioridade                               | Tempo estimado                            | Impacto no usuário                                                    | Impacto em conversão                                     | Impacto em SEO                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Corrigir o [MISMATCH]: unificar a copy institucional (Hero, Como Funciona, Índice Explicado, Como Avaliamos, FAQ) com os 6 critérios/pesos reais da metodologia implementada              | **Alta**                                 | Pequeno (cópia de texto, sem lógica nova) | Alto — remove a maior fonte de desconfiança do site                   | Médio — confiança é pré-requisito de clique em "comprar" | Médio — EEAT depende de consistência factual                                |
| 2   | Substituir a seção `RankingPreview` da home (skeleton "em preparação") pelos dados reais de `/creatina` ou por um link direto e proeminente para o ranking                                | **Alta**                                 | Pequeno                                   | Alto — é a principal barreira entre a home e o produto real           | Alto — hoje ativamente afasta o visitante do funil       | Baixo                                                                       |
| 3   | Trocar CTA principal do Navbar de "Receber ranking" (e-mail) para "Ver ranking" (produto)                                                                                                 | **Alta**                                 | Muito pequeno                             | Alto — corrige a ordem do funil (mostrar valor antes de pedir e-mail) | Alto — é o elemento de maior exposição do site inteiro   | Baixo                                                                       |
| 4   | Substituir URLs de oferta fictícias por links reais (mesmo não-afiliados no início)                                                                                                       | **Alta**                                 | Pequeno (dado, não arquitetura)           | Alto — sem isso a conversão é fisicamente impossível                  | Muito alto — é o botão que gera receita                  | Baixo                                                                       |
| 5   | Ativar o schema Product/Offer/AggregateRating (já implementado) em `/creatina/[slug]`, com a URL correta                                                                                  | **Alta**                                 | Muito pequeno                             | Baixo direto, alto indireto (mais cliques vindos da busca)            | Médio — CTR de busca orgânica maior                      | Alto — rich results são o maior alavancador de CTR orgânico disponível hoje |
| 6   | Adicionar contador/prova de volume na home e no ranking ("X produtos avaliados", data de atualização)                                                                                     | Média                                    | Pequeno                                   | Médio — reforça confiança e atualidade                                | Médio                                                    | Baixo                                                                       |
| 7   | Adicionar filtro/ordenação no ranking (preço, preço por dose, marca)                                                                                                                      | Média                                    | Médio                                     | Alto conforme o catálogo crescer (baixo com 10 itens)                 | Médio                                                    | Baixo                                                                       |
| 8   | Enriquecer a página de detalhe: link contextual "comparar com os outros do ranking", posição no ranking, versão da metodologia visível junto aos critérios                                | Média                                    | Pequeno–Médio                             | Médio                                                                 | Médio                                                    | Médio (mais links internos)                                                 |
| 9   | Expor `CompareSupplementsUseCase` já existente como recurso de UI (comparação lado a lado de 2–3 produtos)                                                                                | Média                                    | Médio (UI sobre lógica já pronta)         | Alto conforme catálogo cresce                                         | Médio                                                    | Baixo                                                                       |
| 10  | Remover ou explicar o botão "Comparar outras lojas" (hoje sempre desabilitado, sem explicação)                                                                                            | Média                                    | Muito pequeno                             | Baixo–Médio                                                           | Baixo                                                    | —                                                                           |
| 11  | Adicionar parágrafo introdutório rico em `/creatina` (contexto, como escolher) + H2/H3 respondendo às intenções de busca-alvo ("creatina vale a pena", "como escolher a melhor creatina") | Média                                    | Pequeno                                   | Médio                                                                 | Baixo                                                    | Alto                                                                        |
| 12  | Gerar `sitemap.ts` dinamicamente a partir do banco (hoje hardcoded, sem os produtos/creatina)                                                                                             | Média                                    | Pequeno                                   | Nenhum direto                                                         | Nenhum direto                                            | Alto — sem isso o Google não descobre as páginas de produto                 |
| 13  | Fotografia/imagem real por produto substituindo o placeholder único genérico                                                                                                              | Baixa (agora) / Alta (na escala)         | Médio–Grande (depende de fonte da imagem) | Alto no longo prazo                                                   | Médio                                                    | Baixo–Médio                                                                 |
| 14  | Criar página de índice de categorias (`/categorias`) e evoluir para múltiplas categorias vivas                                                                                            | Baixa (curto prazo) / Alta (estratégico) | Grande                                    | Alto no médio prazo                                                   | Alto no médio prazo                                      | Alto (mais superfícies de ranqueamento)                                     |
| 15  | Primeiro conteúdo editorial (artigo) linkando para `/creatina`, iniciando cluster de SEO                                                                                                  | Baixa (curto prazo)                      | Grande                                    | Baixo imediato                                                        | Baixo imediato                                           | Alto no médio/longo prazo                                                   |

---

## Resumo executivo

O produto tem uma base de confiança genuína (motor de cálculo real, metodologia versionada, dados reais persistidos) que está sendo **subestimada e, em um ponto crítico, contradita** pela camada de apresentação. As três falhas de maior impacto — a metodologia anunciada não bater com a metodologia real, a home escondendo o ranking que já existe, e o botão de compra não funcionar de verdade — têm em comum o fato de custarem **horas, não sprints**, e de serem exatamente o tipo de problema que, não corrigido, torna irrelevante qualquer investimento futuro em aquisição (SEO, tráfego pago, PR), porque o visitante que chegar vai encontrar um produto que parece inacabado ou, pior, inconsistente consigo mesmo. A recomendação é tratar os 5 itens classificados como "Alta" nesta tabela como pré-requisito de qualquer outro trabalho de produto — inclusive do roadmap de funcionalidades já traçado anteriormente.
