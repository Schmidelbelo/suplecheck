/**
 * Chamado no fim de todo script `prisma/publish*.ts` depois de marcar o
 * produto como PUBLISHED — invalida só a categoria afetada (e o
 * produto, e `/ofertas`+`/mercado` quando for creatina) no deploy real,
 * via `/api/admin/revalidate` (ver esse route.ts para o porquê do
 * escopo). Sem isto, a página só refletiria o produto novo depois da
 * janela de `revalidate` (12h) ou de um redeploy.
 *
 * Melhor esforço: se `NEXT_PUBLIC_SITE_URL`/`ADMIN_API_KEY` não
 * estiverem no `.env` local (ex.: rodando contra um banco sem deploy
 * publicado ainda) ou o deploy estiver fora do ar, o script de
 * publicação não falha por causa disto — só avisa.
 */
export async function triggerRevalidation(categorySlug: string, productSlug?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const apiKey = process.env.ADMIN_API_KEY;
  if (!siteUrl || !apiKey) {
    console.warn(
      "[revalidate] NEXT_PUBLIC_SITE_URL ou ADMIN_API_KEY ausente — pulando invalidação sob demanda (a página atualiza sozinha na próxima janela de 12h).",
    );
    return;
  }

  try {
    const res = await fetch(new URL("/api/admin/revalidate", siteUrl), {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ categorySlug, productSlug }),
    });
    if (!res.ok) {
      console.warn(
        `[revalidate] falhou (${res.status}) — página atualiza na próxima janela de 12h.`,
      );
      return;
    }
    const body = await res.json();
    console.warn(`[revalidate] caminhos invalidados: ${body.revalidated?.join(", ")}`);
  } catch (error) {
    console.warn(
      "[revalidate] erro ao chamar o deploy — página atualiza na próxima janela de 12h.",
      error,
    );
  }
}
