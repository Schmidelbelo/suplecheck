"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  History,
  GitCompareArrows,
  Trash2,
  BarChart3,
  Bell,
  BellOff,
  Search,
  Sparkles,
  UserRound,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils/format";
import { ProductMiniCard } from "@/components/shared/ProductMiniCard";
import { useFavorites } from "./FavoriteButton";
import { useRecentlyViewed, useRecentComparisons } from "../lib/recentActivity";
import { useCategoryRanking } from "../lib/useCategoryRanking";
import { buildDashboardStats } from "../lib/dashboardStats";
import { usePriceAlerts, isAlertTriggered } from "@/modules/pricing/lib/priceAlerts";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { useSearchHistory } from "@/modules/monitoring/lib/searchHistory";
import { generatePersonalInsights } from "@/modules/monitoring/lib/personalInsights";
import { PersonalInsightsList } from "@/modules/monitoring/components/PersonalInsightsList";
import { useRecommendationHistory } from "@/modules/recommendation/lib/recommendationHistory";
import {
  decodeProfileFromSearchParams,
  PRIORITY_LABELS,
} from "@/modules/recommendation/lib/profileQuery";
import type { RankingView } from "../types";
import { useCapturedEmail } from "@/modules/leads/lib/useCapturedEmail";
import { LeadCaptureForm } from "@/modules/leads/components/LeadCaptureForm";

function resolveProduct(ranking: RankingView | null, slug: string) {
  return ranking?.entries.find((e) => e.product.slug === slug) ?? null;
}

export function DashboardClient() {
  const { values: favoriteIds, hydrated: favoritesHydrated } = useFavorites();
  const { items: history, hydrated: historyHydrated, clear: clearHistory } = useRecentlyViewed();
  const { items: comparisons, hydrated: comparisonsHydrated } = useRecentComparisons();
  const { items: alerts, hydrated: alertsHydrated, remove: removeAlert } = usePriceAlerts();
  const { items: searches, hydrated: searchesHydrated, clear: clearSearches } = useSearchHistory();
  const { items: recommendations, hydrated: recommendationsHydrated } = useRecommendationHistory();
  const { ranking, loading: rankingLoading } = useCategoryRanking();
  const { email: capturedEmail, hydrated: emailHydrated } = useCapturedEmail();

  const hydrated =
    favoritesHydrated &&
    historyHydrated &&
    comparisonsHydrated &&
    alertsHydrated &&
    searchesHydrated &&
    recommendationsHydrated &&
    emailHydrated;

  if (!hydrated || rankingLoading) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const stats = buildDashboardStats(history, ranking);
  const favoriteEntries = (ranking?.entries ?? []).filter((e) => favoriteIds.has(e.product.id));
  const hasAnyActivity =
    favoriteEntries.length > 0 ||
    history.length > 0 ||
    comparisons.length > 0 ||
    alerts.length > 0 ||
    searches.length > 0 ||
    recommendations.length > 0;

  const lastRecommendation = recommendations[0] ?? null;
  const lastProfile = lastRecommendation
    ? decodeProfileFromSearchParams(new URLSearchParams(lastRecommendation.query))
    : null;

  const viewedProductsForInsights = history
    .map((view) => {
      const entry = resolveProduct(ranking, view.slug);
      return entry
        ? {
            slug: view.slug,
            productName: entry.product.name,
            brandName: entry.product.brand.name,
            visitCount: view.visitCount,
          }
        : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const comparisonSpreads = comparisons
    .map((comparison) => {
      const prices = comparison.slugs
        .map((slug) => resolveProduct(ranking, slug)?.product.price?.cents ?? null)
        .filter((v): v is number => v != null);
      return prices.length >= 2 ? { spreadCents: Math.max(...prices) - Math.min(...prices) } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  const recommendationBudgetsCents = recommendations
    .map((r) => decodeProfileFromSearchParams(new URLSearchParams(r.query)).budgetCents)
    .filter((v): v is number => v != null);

  const personalInsights = generatePersonalInsights({
    viewedProducts: viewedProductsForInsights,
    favoritesCount: favoriteEntries.length,
    recommendationBudgetsCents,
    comparisonSpreads,
  });

  if (!hasAnyActivity) {
    return (
      <EmptyState
        icon={<BarChart3 aria-hidden />}
        title="Sua área ainda está vazia"
        description="Favorite produtos, compare opções e explore o ranking — tudo o que você fizer aparece aqui, salvo só neste navegador."
        action={
          <Button asChild>
            <Link href="/creatina">Explorar o ranking</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Produtos vistos" value={String(stats.productsViewedCount)} />
        <StatCard
          label="Nota média dos produtos vistos"
          value={stats.averageScore != null ? stats.averageScore.toFixed(1) : "—"}
        />
        <StatCard label="Marca mais pesquisada" value={stats.topBrand ?? "—"} />
        <StatCard label="Categoria favorita" value={stats.topCategory ?? "—"} />
      </div>

      {/* Captura de e-mail — só aparece quando este navegador ainda não deu um e-mail em nenhum formulário */}
      {!capturedEmail ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <p className="text-text flex items-center gap-2 text-sm font-medium">
              <Mail className="size-4" aria-hidden />
              Quer receber novidades por e-mail?
            </p>
            <p className="text-text-muted text-sm">
              Deixe seu e-mail para receber o ranking e futuras notificações de preço, quando o
              envio automático estiver ativo.
            </p>
            <LeadCaptureForm
              source="dashboard_minha_area"
              submitLabel="Salvar e-mail"
              successMessage="E-mail salvo! Em breve você poderá receber notificações por aqui."
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Insights pessoais */}
      {personalInsights.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-text flex items-center gap-2 text-lg font-bold">
            <Sparkles className="size-4" aria-hidden />
            Insights pessoais
          </h2>
          <PersonalInsightsList insights={personalInsights} />
        </div>
      ) : null}

      {/* Resumo do perfil + última recomendação */}
      {lastRecommendation && lastProfile ? (
        <DashboardSection
          icon={<UserRound className="size-4" aria-hidden />}
          title="Resumo do perfil"
          count={0}
        >
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-text-muted">
                  Prioridade:{" "}
                  <span className="text-text font-medium">
                    {PRIORITY_LABELS[lastProfile.priority]}
                  </span>
                </span>
                {lastProfile.budgetCents != null ? (
                  <span className="text-text-muted">
                    Orçamento:{" "}
                    <span className="text-text font-medium">
                      {formatCurrencyBRL(lastProfile.budgetCents)}
                    </span>
                  </span>
                ) : null}
                {lastProfile.trainingLevel ? (
                  <span className="text-text-muted">
                    Nível:{" "}
                    <span className="text-text font-medium">{lastProfile.trainingLevel}</span>
                  </span>
                ) : null}
              </div>
              <div className="border-border flex items-center justify-between gap-4 border-t pt-3">
                <div>
                  <p className="text-text-subtle text-xs uppercase">Última recomendação</p>
                  <p className="text-text font-medium">
                    {lastRecommendation.recommendedProductName}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/assistente?${lastRecommendation.query}`}>Ver de novo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </DashboardSection>
      ) : null}

      {/* Favoritos */}
      <DashboardSection
        icon={<Heart className="size-4" aria-hidden />}
        title="Favoritos"
        count={favoriteEntries.length}
        viewAllHref="/favoritos"
      >
        {favoriteEntries.length === 0 ? (
          <p className="text-text-muted text-sm">Nenhum produto favoritado ainda.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {favoriteEntries.slice(0, 3).map((entry) => (
              <MiniProductCard
                key={entry.product.id}
                href={`/creatina/${entry.product.slug}`}
                name={entry.product.name}
                brand={entry.product.brand.name}
                imageUrl={entry.product.imageUrl}
                priceCents={entry.product.price?.cents ?? null}
                score={entry.finalScore}
                classificationTier={entry.classificationTier}
              />
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Histórico de visitas */}
      <DashboardSection
        icon={<History className="size-4" aria-hidden />}
        title="Histórico de visitas"
        count={history.length}
        action={
          history.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearHistory} className="gap-1.5">
              <Trash2 className="size-4" aria-hidden />
              Limpar histórico
            </Button>
          ) : null
        }
      >
        {history.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhum produto visitado ainda — acesse a página de um produto para começar.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {history.map((view) => {
              const entry = resolveProduct(ranking, view.slug);
              if (!entry) return null;
              return (
                <li key={view.slug}>
                  <Link
                    href={`/creatina/${view.slug}`}
                    className="hover:bg-bg-subtle flex items-center justify-between gap-4 rounded-md px-2 py-2 transition-colors"
                  >
                    <span className="text-text truncate text-sm font-medium">
                      {entry.product.name}
                    </span>
                    <span className="text-text-subtle shrink-0 text-xs">
                      {formatRelativeTime(view.viewedAt)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      {/* Pesquisas recentes */}
      <DashboardSection
        icon={<Search className="size-4" aria-hidden />}
        title="Pesquisas recentes"
        count={searches.length}
        action={
          searches.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={clearSearches} className="gap-1.5">
              <Trash2 className="size-4" aria-hidden />
              Limpar histórico
            </Button>
          ) : null
        }
      >
        {searches.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhuma pesquisa registrada ainda — use a busca no ranking de creatinas.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {searches.map((search) => (
              <Link
                key={search.term.toLowerCase()}
                href={`/creatina`}
                className="border-border hover:border-brand text-text-muted hover:text-brand rounded-full border px-3 py-1.5 text-sm transition-colors"
              >
                {search.term}
              </Link>
            ))}
          </div>
        )}
      </DashboardSection>

      {/* Alertas de preço */}
      <DashboardSection
        icon={<Bell className="size-4" aria-hidden />}
        title="Alertas de preço"
        count={alerts.length}
        viewAllHref="/alertas"
      >
        {alerts.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhum alerta configurado — abra a página de um produto e defina um preço alvo.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {alerts.map((alert) => {
              const entry = resolveProduct(ranking, alert.slug);
              const currentCents = entry?.product.price?.cents;
              const triggered =
                alert.type === "below" &&
                currentCents != null &&
                isAlertTriggered(alert, currentCents, currentCents);
              return (
                <div
                  key={alert.productId}
                  className="border-border flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <Link href={`/creatina/${alert.slug}`} className="min-w-0 flex-1">
                    <p className="text-text truncate text-sm font-medium">{alert.productName}</p>
                    <p className="text-text-muted text-xs">
                      {triggered
                        ? "Condição atingida!"
                        : alert.type === "lowest"
                          ? "Avisar no menor preço já visto"
                          : `Avisar abaixo de ${formatCurrencyBRL(alert.targetCents ?? 0)}`}
                    </p>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAlert(alert.productId)}
                    aria-label={`Remover alerta de ${alert.productName}`}
                  >
                    <BellOff className="size-4" aria-hidden />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DashboardSection>

      {/* Comparações recentes */}
      <DashboardSection
        icon={<GitCompareArrows className="size-4" aria-hidden />}
        title="Comparações recentes"
        count={comparisons.length}
      >
        {comparisons.length === 0 ? (
          <p className="text-text-muted text-sm">
            Nenhuma comparação salva ainda — selecione 2 ou mais produtos no ranking e toque em
            &ldquo;Comparar&rdquo;.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {comparisons.map((comparison) => {
              const entries = comparison.slugs
                .map((slug) => resolveProduct(ranking, slug))
                .filter((e) => e !== null);
              if (entries.length === 0) return null;
              return (
                <Link
                  key={comparison.slugs.join(",")}
                  href={`/creatina?comparar=${comparison.slugs.join(",")}`}
                  className="border-border hover:border-border-strong flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {entries.slice(0, 3).map((entry) => (
                      <Image
                        key={entry.product.id}
                        src={entry.product.imageUrl ?? "/images/products/creatina-placeholder.svg"}
                        alt={entry.product.name}
                        width={36}
                        height={36}
                        className="border-border bg-bg-subtle -ml-2 size-9 rounded-full border object-cover first:ml-0"
                      />
                    ))}
                    <span className="text-text-muted ml-2 text-sm">
                      {entries.map((e) => e.product.name).join(" vs. ")}
                    </span>
                  </div>
                  <span className="text-text-subtle shrink-0 text-xs">
                    {formatRelativeTime(comparison.comparedAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </DashboardSection>

      {/* Produtos mais acessados */}
      {stats.mostViewedProducts.length > 0 ? (
        <DashboardSection
          icon={<BarChart3 className="size-4" aria-hidden />}
          title="Produtos mais acessados por você"
          count={stats.mostViewedProducts.length}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.mostViewedProducts.map(({ entry, visits }) => (
              <MiniProductCard
                key={entry.product.id}
                href={`/creatina/${entry.product.slug}`}
                name={entry.product.name}
                brand={entry.product.brand.name}
                imageUrl={entry.product.imageUrl}
                priceCents={entry.product.price?.cents ?? null}
                score={entry.finalScore}
                classificationTier={entry.classificationTier}
                footer={`${visits} visita${visits > 1 ? "s" : ""}`}
              />
            ))}
          </div>
        </DashboardSection>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-5">
        <p className="text-text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
        <p className="text-text truncate text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function DashboardSection({
  icon,
  title,
  count,
  viewAllHref,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  viewAllHref?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-text flex items-center gap-2 text-lg font-bold">
          {icon}
          {title}
          {count > 0 ? (
            <Badge variant="default" className="ml-1">
              {count}
            </Badge>
          ) : null}
        </h2>
        {viewAllHref && count > 0 ? (
          <Link href={viewAllHref} className="text-brand text-sm font-medium hover:underline">
            Ver todos
          </Link>
        ) : (
          action
        )}
      </div>
      {children}
    </section>
  );
}

function MiniProductCard({
  href,
  name,
  brand,
  imageUrl,
  priceCents,
  score,
  classificationTier,
  footer,
}: {
  href: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  priceCents: number | null;
  score: number;
  classificationTier: string;
  footer?: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-border-strong flex h-full flex-col gap-2 p-3 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
        <ProductMiniCard
          imageUrl={imageUrl}
          name={name}
          brandName={brand}
          priceCents={priceCents}
          classificationTier={classificationTier}
          score={score}
        />
        {footer ? <p className="text-text-subtle text-xs">{footer}</p> : null}
      </Card>
    </Link>
  );
}
