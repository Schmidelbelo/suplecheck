# Publicacao do dominio oficial SupleScore

## Decisao canonica

Dominio canonico escolhido: `https://suplescore.com.br`.

Motivo: o dominio raiz e mais curto, direto e forte para marca. A variante `www.suplescore.com.br` deve existir apenas como alias tecnico e redirecionar permanentemente para o dominio raiz.

## Variaveis de ambiente de producao

Configurar na Vercel, ambiente Production:

| Variavel | Valor |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://suplescore.com.br` |
| `NEXT_PUBLIC_GA_ID` | preencher com o Measurement ID do GA4 (`G-...`) |
| `NEXT_PUBLIC_CLARITY_ID` | preencher com o Project ID do Microsoft Clarity |
| `NEXT_PUBLIC_SENTRY_DSN` | preencher com o DSN publico do projeto Sentry |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | preencher com o codigo da meta tag do Google Search Console |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | preencher com o codigo da meta tag do Bing Webmaster Tools |

As variaveis sensiveis existentes (`DATABASE_URL`, `DIRECT_URL`, `ADMIN_API_KEY`, `RESEND_API_KEY`) devem ser preservadas.

## Vercel

1. Abrir o projeto da SupleScore na Vercel.
2. Acessar Settings > Domains.
3. Adicionar `suplescore.com.br`.
4. Adicionar `www.suplescore.com.br`.
5. Definir `suplescore.com.br` como dominio principal do projeto.
6. Confirmar que `www.suplescore.com.br` redireciona para `https://suplescore.com.br`.
7. Apos o DNS propagar, confirmar certificado HTTPS ativo para os dois hosts.
8. Fazer novo deploy de Production depois de configurar as variaveis.

Fonte tecnica: a Vercel recomenda usar o valor exibido no card do dominio como fonte final de verdade. Neste projeto, a verificacao da Vercel retornou os valores abaixo em 2026-09-04.

## DNS

Valores retornados pela Vercel para o projeto `suplecheck`:

- Apex `suplescore.com.br`: `A 216.198.79.1` e `A 64.29.17.1`.
- Subdominio `www.suplescore.com.br`: `CNAME 72934b0b7f2b2117.vercel-dns-017.com.`

Alternativa tambem aceita pela Vercel: delegar o DNS para `ns1.vercel-dns.com` e `ns2.vercel-dns.com`. Como o pedido e manter DNS fora da automacao, a opcao recomendada aqui e configurar apenas os registros abaixo no provedor DNS atual.

### Cloudflare

| Type | Name | Content | Proxy | TTL |
| --- | --- | --- | --- | --- |
| `A` | `@` | `216.198.79.1` | DNS only | Auto |
| `A` | `@` | `64.29.17.1` | DNS only | Auto |
| `CNAME` | `www` | `72934b0b7f2b2117.vercel-dns-017.com` | DNS only | Auto |

Observacao: deixar o proxy desligado durante a validacao inicial para evitar conflito de certificado, redirect e cache. Depois de validar, avaliar proxy Cloudflare separadamente.

### Registro.br

| Tipo | Nome | Valor |
| --- | --- | --- |
| `A` | vazio ou `@` | `216.198.79.1` |
| `A` | vazio ou `@` | `64.29.17.1` |
| `CNAME` | `www` | `72934b0b7f2b2117.vercel-dns-017.com` |

Observacao: se o Registro.br estiver usando DNS de outro provedor, configurar os registros no provedor autoritativo, nao no painel do Registro.br.

### GoDaddy

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| `A` | `@` | `216.198.79.1` | 1 hour ou default |
| `A` | `@` | `64.29.17.1` | 1 hour ou default |
| `CNAME` | `www` | `72934b0b7f2b2117.vercel-dns-017.com` | 1 hour ou default |

### Hostinger

| Type | Name | Points to | TTL |
| --- | --- | --- | --- |
| `A` | `@` | `216.198.79.1` | default |
| `A` | `@` | `64.29.17.1` | default |
| `CNAME` | `www` | `72934b0b7f2b2117.vercel-dns-017.com` | default |

## Google Search Console

1. Criar propriedade de dominio para `suplescore.com.br`.
2. Validar por DNS quando possivel.
3. Alternativamente, usar meta tag e preencher `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.
4. Enviar `https://suplescore.com.br/sitemap.xml`.
5. Confirmar que os sitemaps segmentados sao descobertos:
   - `https://suplescore.com.br/sitemap-produtos.xml`
   - `https://suplescore.com.br/sitemap-marcas.xml`
   - `https://suplescore.com.br/sitemap-categorias.xml`
   - `https://suplescore.com.br/sitemap-comparacoes.xml`
6. Inspecionar inicialmente:
   - `https://suplescore.com.br/`
   - `https://suplescore.com.br/creatina`
   - `https://suplescore.com.br/marcas`
   - `https://suplescore.com.br/categorias`
   - `https://suplescore.com.br/comparar`
   - `https://suplescore.com.br/ofertas`
   - `https://suplescore.com.br/contato`

## Bing Webmaster Tools

1. Criar propriedade para `https://suplescore.com.br`.
2. Importar do Google Search Console ou validar por meta tag.
3. Se usar meta tag, preencher `NEXT_PUBLIC_BING_SITE_VERIFICATION`.
4. Enviar `https://suplescore.com.br/sitemap.xml`.

## Checklist final

- [ ] Dominio `suplescore.com.br` adicionado na Vercel.
- [ ] Dominio `www.suplescore.com.br` adicionado na Vercel.
- [ ] DNS apex apontando para Vercel.
- [ ] DNS `www` apontando para Vercel.
- [ ] HTTPS ativo nos dois hosts.
- [ ] `www` redirecionando para o dominio raiz.
- [ ] `NEXT_PUBLIC_SITE_URL=https://suplescore.com.br` em Production.
- [ ] GA4 configurado.
- [ ] Microsoft Clarity configurado.
- [ ] Sentry configurado.
- [ ] Google Search Console validado.
- [ ] Bing Webmaster Tools validado.
- [ ] `robots.txt` acessivel.
- [ ] `sitemap.xml` acessivel.
- [ ] Sitemaps segmentados acessiveis.
- [ ] Canonical das paginas aponta para `https://suplescore.com.br`.
