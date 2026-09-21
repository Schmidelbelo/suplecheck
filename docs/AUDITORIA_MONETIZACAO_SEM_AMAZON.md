# Oportunidades de monetização sem depender da aprovação fiscal da Amazon

Levantamento **só leitura** contra produção + pesquisa web, 2026-09-21
— mapeamento de lojas usadas pelo catálogo publicado e verificação de
quais têm programa de afiliados real e ativo, independente do status
fiscal da Amazon (`Enviado`, aguardando revisão). **Nada foi
configurado.** Nenhum banco, afiliado, imagem, ranking, código, schema
ou `affiliate-discovery` alterado.

---

## 1. Panorama por loja (59 produtos `PUBLISHED`)

| Loja                                                                                                          | Produtos    | Situação hoje                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `amazon-br`                                                                                                   | 15          | ✅ Monetizada via template (`tag=suplescore-20`), **mas depende da aprovação fiscal pendente**                                                                     |
| `mercado-livre`                                                                                               | 3           | 1 configurada (Growth Óleo de Peixe), 2 descartadas (ambiguidade/anúncio morto) — nenhum candidato novo                                                            |
| `loja-oficial` (genérico, 3 produtos mal atribuídos)                                                          | 3           | Sem programa — são as 3 URLs de busca Amazon ainda pendentes (Vitafor, Dux, Integralmédica)                                                                        |
| `integralmedica-oficial`                                                                                      | 2           | ⭐ Ver §2 — programa ativo encontrado via Lomadee                                                                                                                  |
| `max-titanium-oficial`                                                                                        | 2           | ⭐ Ver §2 — programa próprio encontrado                                                                                                                            |
| `nutrata-oficial`, `darkness-oficial`, `probiotica-oficial`, `vitafor-oficial`, `dux-oficial`, `gsuplementos` | 2 ou 1 cada | Ver §2 — só Probiótica e Growth têm programa identificado, ambos descartados (ver motivos)                                                                         |
| Demais 20 lojas (revendedores menores, 1 produto cada)                                                        | 1 cada      | Nenhuma pesquisada individualmente — volume baixo (1 produto cada) não justifica o esforço de descobrir programa próprio de 20 revendedores distintos nesta rodada |

## 2. Investigação das lojas de marca com mais produtos (2+)

### Integralmédica — 🟢 programa real e ativo (Lomadee)

- **Rede**: Lomadee (rede de afiliados brasileira estabelecida,
  mesmo modelo de Awin/Rakuten, mas nacional).
- **Status**: **ativo**, 8% de comissão, cookie de 30 dias.
- **Cadastro**: sem exigência de CNPJ, pagamento via Pix — barreira de
  entrada baixa.
- **Produtos já no catálogo com esta loja**:
  `integralmedica-whey-protein-concentrado-900g`,
  `integralmedica-coq10-30-capsulas` (2 produtos, ambos já publicados,
  sem ambiguidade de sabor/variante).
- **Classificação**: 🟢 **pronta para ação** — falta só o cadastro
  humano na Lomadee (decisão comercial/administrativa, não técnica).

### Max Titanium — 🟡 programa próprio, mas modelo diferente

- **Programa**: "Minha Loja Max Titanium"
  (`minhaloja.maxtitanium.com.br`) — não é uma rede de afiliados
  tradicional (tipo Lomadee/Awin), é uma "vitrine personalizada":
  você cria uma loja com produtos escolhidos e ganha comissão nas
  vendas feitas através dela.
- **Risco identificado**: existe também um programa de influenciadores
  "Max Team Influencers" (via plataforma BrandLovrs) com reclamações
  registradas no Reclame Aqui sobre não cumprimento de benefícios —
  **não é o mesmo programa** que "Minha Loja", mas é um sinal de
  atenção sobre a experiência de parceiros da marca em geral.
- **Produtos já no catálogo**: `max-titanium-100-whey-protein-900g`,
  `max-titanium-colagen-100-capsulas` (2 produtos).
- **Classificação**: 🟡 **precisa confirmação humana** — o modelo
  "vitrine personalizada" pode não se encaixar bem num site
  comparador de preços (SupleScore linka direto para a página do
  produto em várias lojas, não teria como direcionar todo o tráfego
  para "uma loja Max Titanium própria" sem redesenhar o fluxo) —
  precisa de alguém avaliar se o modelo técnico do programa é
  compatível com como o `/go` funciona hoje antes de decidir.

### Probiótica — ❌ descartar (não se aplica)

- **Programa "SOU PRO"**: exclusivo para profissionais de educação
  física registrados no conselho da categoria (CREF) — não é aberto a
  site/afiliado, é um programa de embaixadores para profissionais.
- **Classificação**: ❌ **descartar** — não é um programa de afiliado
  que o SupleScore possa usar.

### Growth Supplements — ❌ descartar por enquanto (programa inativo)

- **Programa**: existe cadastro em Lomadee, mas **status atual:
  inativo**.
- **Classificação**: ❌ **descartar por enquanto** — não é uma opção
  hoje; vale reconferir periodicamente se reativar (Growth é a marca
  com mais produtos no catálogo entre as lojas próprias).

### Dux Human Health — 🟡 precisa mais investigação

- Encontrado um "Programa de Influenciadores DUX"
  (`influenciadores.duxnutrition.com`) — não ficou claro se aceita
  cadastro de site/comparador de preços ou só criadores de conteúdo
  em redes sociais (Instagram/TikTok). Não investigado a fundo por
  já ter avaliação em aberto de risco de linha ambígua nesta mesma
  marca (`dux-creatina-300g`, ver `docs/AUDITORIA_PROXIMOS_CANDIDATOS_MONETIZACAO.md`).
- **Classificação**: 🟡 **precisa confirmação humana** — modelo do
  programa não está claro o suficiente para classificar como pronto.

### Vitafor, Darkness, Nutrata — não investigadas a fundo

Nenhuma menção a programa de afiliados público encontrada nas buscas
realizadas — não é uma conclusão definitiva de "não existe", só que
não apareceu nos resultados desta rodada. Ficam como item para
pesquisa futura se a frente for retomada.

## 3. Top oportunidades reais fora da Amazon (classificação final)

| #   | Oportunidade                      | Classificação                                                                              |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | **Integralmédica via Lomadee**    | 🟢 Pronta para ação — programa ativo, 8% comissão, sem CNPJ, 2 produtos já no catálogo     |
| 2   | Max Titanium "Minha Loja"         | 🟡 Precisa confirmação humana — modelo de vitrine própria pode não encaixar no `/go` atual |
| 3   | Dux "Programa de Influenciadores" | 🟡 Precisa confirmação humana — não está claro se aceita site/comparador                   |
| 4   | Growth Supplements (Lomadee)      | ❌ Descartar por enquanto — programa cadastrado mas inativo                                |
| 5   | Probiótica "SOU PRO"              | ❌ Descartar — exclusivo para profissionais de educação física, não aplicável              |

Não há 5 oportunidades **prontas** — só 1. As outras 4 completam a
lista de "investigadas" pedida no escopo, mas 2 são descartes reais e
2 precisam de mais decisão antes de virarem ação.

## 4. Bloqueios comerciais/técnicos identificados

- **Comercial**: cadastro em programa de afiliado de marca/rede
  (Lomadee) é uma decisão administrativa — precisa de alguém com
  autoridade para criar conta, aceitar termos e (possivelmente)
  fornecer dados de pagamento/PIX da empresa. Não é algo que deva ser
  executado nesta auditoria nem sem autorização explícita.
- **Técnico**: o programa "Minha Loja" da Max Titanium usa um modelo
  de vitrine própria, não link de afiliado por produto — pode exigir
  avaliação de compatibilidade com o fluxo `/go` atual antes de valer
  a pena perseguir.
- **Mercado Livre**: confirmado, mais uma vez, que não há candidato
  novo além dos 3 já conhecidos (1 configurado, 2 descartados) — não
  é um bloqueio, é a realidade atual do catálogo.

## 5. Recomendação — 1 próxima ação concreta

**Cadastrar a Integralmédica no Lomadee.** É a única oportunidade
desta lista genuinamente pronta: programa ativo, comissão real (8%),
sem burocracia de CNPJ, e já existem 2 produtos publicados e sem
ambiguidade prontos para linkar assim que o cadastro existir. Essa
ação é administrativa/comercial (criar conta, aceitar termos), não
técnica — não foi executada nesta auditoria e requer decisão e
autorização explícitas de quem administra o projeto antes de
prosseguir.
