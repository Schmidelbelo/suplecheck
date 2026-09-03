"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, History, GitCompareArrows, Trash2, BarChart3, Bell, BellOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils/format";
import { classificationBadgeVariant, classificationLabel } from "../lib/classification";
import { useFavorites } from "./FavoriteButton";
import { useRecentlyViewed, useRecentComparisons } from "../lib/recentActivity";
import { useCategoryRanking } from "../lib/useCategoryRanking";
import { buildDashboardStats } from "../lib/dashboardStats";
import { usePriceAlerts, isAlertTriggered } from "@/modules/pricing/lib/priceAlerts";
import { formatCurrencyBRL } from "@/lib/utils/format";
import type { RankingView } from "../types";

function resolveProduct(ranking: RankingView | null, slug: string) {
  return ranking?.entries.find((e) => e.product.slug === slug) ?? null;
}

export function DashboardClient() {
  const { values: favoriteIds, hydrated: favoritesHydrated } = useFavorites();
  const { items: history, hydrated: historyHydrated, clear: clearHistory } = useRecentlyViewed();
  const { items: comparisons, hydrated: comparisonsHydrated } = useRecentComparisons();
  const { items: alerts, hydrated: alertsHydrated, remove: removeAlert } = usePriceAlerts();
  const { ranking, loading: rankingLoading } = useCategoryRanking();

  const hydrated = favoritesHydrated && historyHydrated && comparisonsHydrated && alertsHydrated;

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
    favoriteEntries.length > 0 || history.length > 0 || comparisons.length > 0 || alerts.length > 0;

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

      {/* Alertas de preço */}
      <DashboardSection
        icon={<Bell className="size-4" aria-hidden />}
        title="Alertas de preço"
        count={alerts.length}
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
  score,
  classificationTier,
  footer,
}: {
  href: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  score: number;
  classificationTier: string;
  footer?: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-border-strong flex h-full flex-col gap-2 p-3 transition-shadow duration-(--duration-base) ease-(--ease-standard) hover:shadow-md">
        <div className="flex items-center gap-2">
          <Image
            src={imageUrl ?? "/images/products/creatina-placeholder.svg"}
            alt={name}
            width={40}
            height={40}
            className="border-border bg-bg-subtle size-10 shrink-0 rounded-md border object-cover"
          />
          <div className="min-w-0">
            <p className="text-text-muted truncate text-xs">{brand}</p>
            <p className="text-text truncate text-sm font-semibold">{name}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text text-sm font-bold tabular-nums">{score.toFixed(1)}</span>
          <Badge variant={classificationBadgeVariant(classificationTier)}>
            {classificationLabel(classificationTier)}
          </Badge>
        </div>
        {footer ? <p className="text-text-subtle text-xs">{footer}</p> : null}
      </Card>
    </Link>
  );
}
