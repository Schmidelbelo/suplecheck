# Backlog de Dados

Este backlog registra dados coletados ou desejados que ainda nao possuem campo estruturado suficiente no schema atual, ou que nao foram confirmados com fonte confiavel nesta sprint. Nada aqui autoriza alteracao de banco; e uma fila editorial para decisoes futuras.

## Campos sem destino estruturado claro

| Campo                                        | Categorias afetadas                     | Motivo para backlog                                                                        | Uso futuro                                        |
| -------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Ingredientes principais em lista normalizada | Pre-Treino, Multivitaminicos, Omega 3   | Hoje pode caber em atributos livres, mas comparacao por ingrediente pede taxonomia propria | Filtros, comparacoes e explicacoes                |
| Cafeina por porcao                           | Pre-Treino                              | Critico para seguranca editorial e comparacao, mas nao existe campo dedicado               | Ranking por intensidade e alertas de estimulantes |
| Beta-alanina por porcao                      | Pre-Treino                              | Dado comparativo relevante em formulas de performance                                      | Melhor concentracao e comparacoes                 |
| Creatina por porcao em pre-treino            | Pre-Treino                              | Algumas formulas incluem creatina; nao deve ser confundido com categoria Creatina          | Comparacao de formula                             |
| Taurina por porcao                           | Pre-Treino                              | Frequente em formulas estimulantes                                                         | Comparacao de formula                             |
| Arginina/citrulina por porcao                | Pre-Treino                              | Relevante para produtos focados em pump                                                    | Comparacao de formula                             |
| EPA por porcao                               | Omega 3                                 | Campo central da categoria                                                                 | Ranking por concentracao                          |
| DHA por porcao                               | Omega 3                                 | Campo central da categoria                                                                 | Ranking por concentracao                          |
| Forma do omega 3                             | Omega 3                                 | TG, EE, fosfolipideo/krill ou algal alteram leitura editorial                              | Filtros e explicacao                              |
| Certificacao de pureza                       | Omega 3                                 | IFOS, MEG-3 e similares precisam ser rastreados por fonte                                  | Selo editorial e confiabilidade                   |
| Materia-prima                                | Omega 3                                 | Peixe, krill ou microalga mudam comparacao e publico                                       | Filtros e paginas especificas                     |
| Matriz completa de micronutrientes           | Multivitaminicos                        | A categoria depende de dezenas de nutrientes por porcao                                    | Ranking por cobertura nutricional                 |
| Publico-alvo do multivitaminico              | Multivitaminicos                        | Generalista, esportivo, cabelo/unhas, imunidade ou senior                                  | Segmentacao editorial                             |
| Adoçantes                                    | Pre-Treino, Whey, produtos em po        | Campo pedido editorialmente, mas nao universal                                             | Filtro e transparencia                            |
| Sabores disponiveis                          | Pre-Treino, Whey, alguns hipercaloricos | Pode variar sem mudar o produto base                                                       | Experiencia de compra e comparacao                |
| Selos WPC/WPI/WPH                            | Whey Protein                            | Existe como sinal editorial, mas nao como campo estruturado                                | Filtros de tipo de proteina                       |
| Selo Creapure                                | Creatina                                | Existe como dado editorial, mas nao como campo estruturado                                 | Filtro de pureza/origem                           |

## Pendencias de coleta por produto

### Pre-Treino

| Produto                               | Pendencias                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Max Titanium Hórus Elite              | Peso da embalagem, doses por embalagem, carboidratos, gorduras, adocantes e tabela nutricional completa |
| Growth Supplements Haze Hardcore 300g | Fonte oficial completa, carboidratos, gorduras, adocantes e sabores oficiais                            |
| Black Skull B.O.P.E. 300g             | Porcao, doses, carboidratos, gorduras e fonte oficial direta                                            |
| Black Skull Bone Crusher 300g         | Fonte oficial direta, gorduras e adocantes                                                              |

### Omega 3

| Produto                                           | Pendencias                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Dux Fish Oil 120 capsulas                         | Porcao exata em capsulas e quantidade de doses por embalagem            |
| Vitafor Omega 3 EPA DHA + Vitamina E 120 capsulas | Quantidade de EPA/DHA por porcao e porcao oficial                       |
| Vitafor Omegafor Plus 120 capsulas                | Quantidade de EPA/DHA por porcao e certificacoes                        |
| Vitafor Omegafor Vegan 60 capsulas                | Quantidade de DHA/EPA, porcao e certificacoes                           |
| Max Titanium Omega 3                              | Pagina oficial de produto, peso, porcao, doses e quantidades de EPA/DHA |

### Multivitaminicos

| Produto                                         | Pendencias                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Growth Supplements Multivitaminico 120 capsulas | Tabela completa de vitaminas/minerais e quantidades por capsula   |
| Max Titanium Multimax Complex 90 capsulas       | Confirmacao em fonte oficial direta e tabela nutricional completa |
| Dux Multivitaminico 90 capsulas                 | Lista completa dos 17 micronutrientes e quantidades               |
| Integralmédica Vita Pure Super 120 capsulas     | Pagina oficial especifica, porcao e tabela completa               |
| Vitafor Imunomult 120 capsulas                  | Pagina oficial especifica, porcao e tabela completa               |
| Dux Hair Gro 60 capsulas                        | Porcao, doses e quantidades por micronutriente                    |

## Regras de tratamento

- Preco nunca entra por estimativa; precisa de captura real, data e origem.
- Composicao nunca entra por inferencia a partir de categoria.
- Se a fonte nao listar ingrediente ou quantidade, o campo permanece pendente.
- Fonte de marketplace pode provar existencia comercial, mas fonte oficial deve ser buscada antes de publicacao.
- Selos e certificacoes so entram quando declarados pela marca ou por documento verificavel.
