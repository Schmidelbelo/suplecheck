# Pipeline Editorial 1.0 da SupleScore

Este documento define o processo operacional permanente para expandir o catalogo da SupleScore com consistencia, rastreabilidade e qualidade editorial. Ele nao altera arquitetura, banco de dados, APIs, SEO, regras de negocio ou componentes publicos; apenas descreve como a equipe deve operar o catalogo usando as capacidades ja existentes do produto.

## Principios

- Todo produto precisa ter fonte verificavel antes de entrar no catalogo.
- Nenhum dado critico deve ser inferido quando a fonte nao confirma.
- Cadastro, avaliacao, publicacao, ranking, comparacoes, SEO e monitoramento sao etapas distintas, mesmo quando feitas pela mesma pessoa.
- Um produto em `DRAFT` e trabalho editorial em andamento; produto publicado e compromisso publico.
- Historico, fonte e decisao editorial precisam ser preservados para auditoria futura.
- Quando houver duvida entre velocidade e confiabilidade, a confiabilidade vence.

## Fluxo Completo

```text
Pesquisa
  ↓
Validacao
  ↓
Cadastro
  ↓
Status DRAFT
  ↓
Validacao Editorial
  ↓
Publicacao
  ↓
Ranking
  ↓
Comparacoes
  ↓
SEO
  ↓
Monitoramento
```

### 1. Pesquisa

Objetivo: reunir os dados brutos do produto a partir de fontes confiaveis.

O editor identifica o produto, confirma sua existencia no mercado, coleta nome oficial, marca, fabricante quando publico, categoria, variantes, imagem, ingredientes, peso, porcoes, dose, dados de rotulo e links de referencia. A fonte preferencial e sempre oficial: site da marca, rotulo do fabricante, pagina institucional ou marketplace oficial da marca. Marketplaces de terceiros podem complementar preco, disponibilidade e imagens, mas nao devem substituir a fonte oficial quando ha conflito.

Saida esperada: um dossie editorial minimo com dados, fontes e lacunas conhecidas.

Checklist obrigatorio:

- [ ] Fonte oficial localizada.
- [ ] Marca confirmada.
- [ ] Nome oficial confirmado.
- [ ] Categoria correta definida.
- [ ] Fabricante confirmado ou marcado como nao publico.
- [ ] Imagem principal localizada.
- [ ] Ingredientes coletados.
- [ ] Quantidade por embalagem coletada.
- [ ] Dose por porcao coletada.
- [ ] Numero de porcoes coletado.
- [ ] Link da fonte salvo.
- [ ] Data da coleta registrada.
- [ ] Lacunas marcadas explicitamente.

### 2. Validacao

Objetivo: transformar a pesquisa em dado confiavel para cadastro.

O editor confere consistencia entre fontes, remove ambiguidades, verifica se a marca e a categoria ja existem, identifica duplicidades, valida nome e slug provavel, compara variantes e separa produto de SKU. Se houver conflito entre fontes, a fonte oficial prevalece; se a fonte oficial for incompleta, a lacuna deve ser mantida em vez de inventada.

Saida esperada: produto aprovado para cadastro ou devolvido para pesquisa.

Checklist obrigatorio:

- [ ] Dados obrigatorios consistentes.
- [ ] Marca existente ou solicitada para cadastro interno.
- [ ] Categoria existente e correta.
- [ ] Produto nao duplicado.
- [ ] SKU nao duplicado.
- [ ] Slug valido e previsivel.
- [ ] Variante separada corretamente do produto principal.
- [ ] Imagem tem origem aceitavel.
- [ ] Informacoes de dose e peso fazem sentido entre si.
- [ ] Conflitos de fonte resolvidos ou documentados.
- [ ] Produto aprovado para cadastro.

### 3. Cadastro

Objetivo: inserir o produto e seus SKUs no sistema interno com status inicial controlado.

O editor cadastra produto, marca, fabricante, categoria, atributos, imagem, SKUs e dados de apoio. O cadastro nao deve publicar automaticamente. A escrita deve seguir o processo administrativo existente e preservar a separacao entre produto, SKU, preco, avaliacao e ranking.

Saida esperada: produto registrado internamente com dados estruturados.

Checklist obrigatorio:

- [ ] Nome cadastrado conforme fonte oficial.
- [ ] Slug cadastrado sem conflito.
- [ ] Categoria vinculada.
- [ ] Marca vinculada.
- [ ] Fabricante vinculado quando conhecido.
- [ ] Descricao preenchida ou lacuna justificada.
- [ ] Imagem principal cadastrada.
- [ ] Texto alternativo da imagem preenchido.
- [ ] Pelo menos um SKU ativo cadastrado.
- [ ] Peso, dose e porcoes revisados.
- [ ] Fonte de origem registrada em nota operacional.
- [ ] Produto salvo sem publicacao automatica.

### 4. Status DRAFT

Objetivo: manter o produto invisivel ao publico ate a revisao editorial.

Todo produto novo deve permanecer em `DRAFT` ate cumprir os requisitos de publicacao. O status `DRAFT` indica que o dado pode existir no banco, mas ainda nao tem confianca suficiente para aparecer publicamente, influenciar ranking ou entrar em comparacoes publicas.

Saida esperada: fila clara de produtos pendentes de revisao.

Checklist obrigatorio:

- [ ] Produto esta em `DRAFT`.
- [ ] Produto nao aparece em pagina publica.
- [ ] Produto nao foi usado em ranking publico.
- [ ] Produto nao foi usado em comparacoes publicas.
- [ ] Pendencias editoriais registradas.
- [ ] Responsavel editorial definido.
- [ ] Prioridade atribuida.

### 5. Validacao Editorial

Objetivo: aprovar o produto como publicavel.

Uma segunda revisao confirma que o produto esta correto, completo o suficiente e aderente a metodologia da categoria. Esta etapa verifica tambem se os dados necessarios para avaliacao existem e se a pagina publica nao gerara promessa indevida, dado ausente disfarçado ou comparacao injusta.

Saida esperada: produto aprovado para publicacao ou devolvido para ajuste.

Checklist obrigatorio:

- [ ] Revisao feita por pessoa diferente ou em momento separado.
- [ ] Fonte oficial reaberta e conferida.
- [ ] Nome, marca e categoria conferidos.
- [ ] SKU principal conferido.
- [ ] Imagem conferida.
- [ ] Dados de dose e porcao conferidos.
- [ ] Criterios avaliaveis revisados.
- [ ] Lacunas aceitaveis documentadas.
- [ ] Nenhuma alegacao nao comprovada incluida.
- [ ] Produto aprovado para publicacao.

### 6. Publicacao

Objetivo: tornar o produto visivel com qualidade minima de experiencia e rastreabilidade.

O produto sai de `DRAFT` apenas depois da validacao editorial. A publicacao deve confirmar que a pagina abre, que o produto aparece na categoria correta, que dados publicos fazem sentido, que breadcrumbs, metadados existentes e links internos continuam coerentes, e que o ranking da categoria foi atualizado quando aplicavel.

Saida esperada: produto publicado e verificavel publicamente.

Checklist obrigatorio:

- [ ] Status alterado para publicado pelo fluxo administrativo.
- [ ] Pagina do produto acessivel.
- [ ] Categoria publica lista o produto quando aplicavel.
- [ ] Ranking atualizado ou justificativa registrada.
- [ ] Sitemap conferido quando houver atualizacao de URL publica.
- [ ] JSON-LD existente conferido.
- [ ] Breadcrumbs conferidos.
- [ ] Links internos conferidos.
- [ ] Imagem renderiza corretamente.
- [ ] Smoke test manual realizado.
- [ ] Publicacao registrada no controle editorial.

### 7. Ranking

Objetivo: refletir a categoria com os produtos publicados e avaliados.

Depois da publicacao, a categoria deve ter ranking coerente com os produtos elegiveis e com a metodologia vigente. O ranking nao deve incluir produtos em `DRAFT`, arquivados ou sem dados minimos quando isso comprometer a comparacao.

Saida esperada: ranking atualizado, explicavel e revisado.

Checklist obrigatorio:

- [ ] Categoria possui metodologia vigente.
- [ ] Produto publicado esta elegivel.
- [ ] Produto em `DRAFT` esta fora do ranking.
- [ ] Ranking regenerado quando necessario.
- [ ] Posicoes conferidas visualmente.
- [ ] Selos e score geral conferidos quando existirem.
- [ ] Empates ou resultados estranhos revisados.
- [ ] Data da ultima atualizacao registrada.

### 8. Comparacoes

Objetivo: garantir que produtos publicados gerem comparacoes uteis e coerentes.

Produtos publicados devem ser considerados para comparacoes internas da categoria, especialmente contra lideres comerciais, produtos de maior busca e alternativas de preco. A operacao editorial deve priorizar comparacoes com intencao de decisao, nao combinacoes aleatorias.

Saida esperada: matriz de comparacoes prioritarias por categoria.

Checklist obrigatorio:

- [ ] Produto comparado com lideres da categoria.
- [ ] Produto comparado com alternativas de preco semelhante.
- [ ] Produto comparado com alternativas premium quando fizer sentido.
- [ ] Comparacoes sem dado suficiente foram evitadas.
- [ ] Vencedor ou diferenca principal revisada.
- [ ] Links internos entre produtos conferidos.
- [ ] Quantidade de comparacoes registrada no dashboard editorial.

### 9. SEO

Objetivo: garantir que a expansao do catalogo aumente superficie indexavel sem degradar qualidade.

Esta etapa e operacional, nao tecnica. O editor confere se as URLs publicas esperadas existem, se a pagina tem conteudo suficiente para ser indexavel, se titulo, descricao, canonical, breadcrumbs e dados estruturados ja existentes estao coerentes, e se a pagina esta conectada por links internos relevantes.

Saida esperada: produto integrado ao grafo editorial da SupleScore.

Checklist obrigatorio:

- [ ] URL publica revisada.
- [ ] Titulo publico coerente.
- [ ] Descricao publica coerente.
- [ ] Canonical conferido.
- [ ] JSON-LD conferido.
- [ ] Breadcrumbs conferidos.
- [ ] Links internos de categoria conferidos.
- [ ] Links internos para comparacoes conferidos.
- [ ] Sitemap enviado ou aguardando atualizacao automatica.
- [ ] Pagina nao e thin content.

### 10. Monitoramento

Objetivo: manter o catalogo confiavel depois da publicacao.

Publicar nao encerra o ciclo. O produto entra em monitoramento de preco, disponibilidade, imagem, links, status de SKU, mudancas de rotulo, mudancas de metodologia e desempenho organico. Alteracoes relevantes devem voltar ao fluxo a partir da etapa adequada: pesquisa, validacao, avaliacao, ranking ou SEO.

Saida esperada: rotina de manutencao com revisao periodica e alertas editoriais.

Checklist obrigatorio:

- [ ] Preco revisado na cadencia da categoria.
- [ ] Disponibilidade revisada.
- [ ] Links externos conferidos.
- [ ] Imagem ainda valida.
- [ ] Produto nao foi descontinuado.
- [ ] Rotulo nao mudou materialmente.
- [ ] Ranking continua coerente.
- [ ] Comparacoes principais continuam validas.
- [ ] Pagina continua indexavel.
- [ ] Pendencias abertas no controle editorial.

## Gates Operacionais

| Gate                 | Criterio de entrada  | Criterio de saida                  | Quem aprova      |
| -------------------- | -------------------- | ---------------------------------- | ---------------- |
| Pesquisa concluida   | Produto identificado | Fontes e dados minimos reunidos    | Curadoria        |
| Validacao concluida  | Dossie de pesquisa   | Dado consistente e sem duplicidade | Curadoria        |
| Cadastro concluido   | Produto validado     | Produto salvo em `DRAFT`           | Operacao         |
| Editorial aprovado   | Produto em `DRAFT`   | Produto apto a publicar            | Editor           |
| Publicacao concluida | Produto aprovado     | URL publica conferida              | Editor           |
| Ranking revisado     | Produto publicado    | Ranking coerente                   | Editor + Produto |
| SEO revisado         | URLs publicas ativas | Indexabilidade conferida           | Editorial        |
| Monitoramento ativo  | Produto publicado    | Cadencia atribuida                 | Operacao         |

## Definicao de Pronto Editorial

Um produto so esta editorialmente pronto quando:

- Tem fonte oficial ou justificativa explicita de ausencia.
- Tem categoria, marca, SKU principal e imagem revisados.
- Esta publicado apenas depois de validacao editorial.
- Esta elegivel ou justificadamente fora do ranking.
- Entra nas comparacoes prioritarias da categoria.
- Tem URL indexavel conferida.
- Possui rotina de monitoramento atribuida.

## Definicao de Bloqueado

Um produto deve permanecer bloqueado quando:

- A marca ou o nome oficial nao puderem ser confirmados.
- A categoria correta estiver ambigua.
- Houver suspeita de duplicidade.
- Dados de rotulo essenciais conflitarem entre fontes.
- A imagem disponivel for inadequada ou sem origem aceitavel.
- A metodologia da categoria ainda nao permitir avaliacao confiavel.
- O produto estiver descontinuado antes da publicacao.
