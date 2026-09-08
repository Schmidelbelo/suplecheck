"use client";

import * as React from "react";
import { RefreshCw, KeyRound, MousePointerClick, Store, Package, Tags } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";

const API_KEY_SESSION_KEY = "suplescore:admin-api-key";

interface MetricsResponse {
  totalClicks: number;
  affiliateClicks: number;
  nonAffiliateClicks: number;
  distinctProductsWithClicks: number;
  publishedProductCount: number;
  byStore: { storeId: string; storeName: string; storeSlug: string | null; clicks: number }[];
  byProduct: {
    productId: string;
    productName: string;
    productSlug: string | null;
    categorySlug: string | null;
    clicks: number;
  }[];
  byCategory: {
    categoryId: string;
    categoryName: string;
    categorySlug: string | null;
    clicks: number;
  }[];
  storesWithoutClicks: { storeId: string; storeName: string; storeSlug: string }[];
  productsWithoutClicks: {
    productId: string;
    productName: string;
    productSlug: string;
    categorySlug: string;
  }[];
  ctrNote: string;
}

/**
 * Reaproveita a mesma `ADMIN_API_KEY` e o mesmo padrão de
 * `AdminJobsClient` (sessionStorage, sem login) — protegido em todo
 * método por `src/middleware.ts` (`/api/admin/*`).
 */
export function AdminMetricsClient() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [keyInput, setKeyInput] = React.useState("");
  const [data, setData] = React.useState<MetricsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(API_KEY_SESSION_KEY);
      if (stored) setApiKey(stored);
    } catch {
      // sessionStorage indisponível — segue exigindo digitar a chave a cada carregamento.
    }
  }, []);

  const fetchMetrics = React.useCallback(async (key: string) => {
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch("/api/admin/metrics", { headers: { "x-api-key": key } });
      if (res.status === 401 || res.status === 403) {
        setAuthError(true);
        setApiKey(null);
        try {
          window.sessionStorage.removeItem(API_KEY_SESSION_KEY);
        } catch {
          // ignora
        }
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch {
      toast({ variant: "danger", title: "Não foi possível carregar as métricas" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (apiKey) void fetchMetrics(apiKey);
  }, [apiKey, fetchMetrics]);

  function submitKey() {
    if (!keyInput.trim()) return;
    try {
      window.sessionStorage.setItem(API_KEY_SESSION_KEY, keyInput.trim());
    } catch {
      // ignora — sessão atual ainda funciona só em memória.
    }
    setApiKey(keyInput.trim());
  }

  if (!apiKey) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col gap-4 p-6">
          <p className="text-text flex items-center gap-2 text-sm font-medium">
            <KeyRound className="size-4" aria-hidden />
            Informe a ADMIN_API_KEY
          </p>
          {authError ? (
            <p className="text-danger text-xs">Chave inválida — tente novamente.</p>
          ) : null}
          <Input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitKey()}
            placeholder="Cole a chave aqui"
            aria-label="API Key"
          />
          <Button onClick={submitKey}>Entrar</Button>
          <p className="text-text-subtle text-xs">
            Guardada só nesta aba (sessionStorage) — some ao fechar.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchMetrics(apiKey)}
          className="gap-1.5"
        >
          <RefreshCw className="size-4" aria-hidden />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={MousePointerClick} label="Cliques totais" value={data.totalClicks} />
        <SummaryCard
          icon={MousePointerClick}
          label="Cliques de afiliado"
          value={data.affiliateClicks}
        />
        <SummaryCard
          icon={Package}
          label="Produtos com clique"
          value={`${data.distinctProductsWithClicks} / ${data.publishedProductCount}`}
        />
        <SummaryCard icon={Tags} label="Lojas sem clique" value={data.storesWithoutClicks.length} />
      </div>

      <p className="text-text-subtle border-border rounded-lg border border-dashed p-4 text-xs">
        {data.ctrNote}
      </p>

      <MetricsTable
        title="Cliques por loja"
        icon={Store}
        rows={data.byStore.map((s) => ({ key: s.storeId, label: s.storeName, value: s.clicks }))}
        emptyLabel="Nenhum clique registrado ainda."
      />

      <MetricsTable
        title="Cliques por categoria"
        icon={Tags}
        rows={data.byCategory.map((c) => ({
          key: c.categoryId,
          label: c.categoryName,
          value: c.clicks,
        }))}
        emptyLabel="Nenhum clique registrado ainda."
      />

      <MetricsTable
        title="Cliques por produto (top 50)"
        icon={Package}
        rows={data.byProduct.map((p) => ({
          key: p.productId,
          label: p.productName,
          value: p.clicks,
        }))}
        emptyLabel="Nenhum clique registrado ainda."
      />

      <div className="flex flex-col gap-3">
        <h3 className="text-text flex items-center gap-2 text-sm font-semibold">
          <Package className="size-4" aria-hidden />
          Produtos publicados sem nenhum clique (até 100)
        </h3>
        {data.productsWithoutClicks.length === 0 ? (
          <p className="text-text-muted text-sm">
            Todos os produtos publicados já receberam ao menos um clique.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.productsWithoutClicks.map((p) => (
              <Badge key={p.productId} variant="outline">
                {p.productName}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="text-text-muted flex items-center gap-1.5 text-xs">
          <Icon className="size-3.5" aria-hidden />
          {label}
        </div>
        <p className="text-text text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function MetricsTable({
  title,
  icon: Icon,
  rows,
  emptyLabel,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  rows: { key: string; label: string; value: number }[];
  emptyLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-text flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4" aria-hidden />
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-text-muted text-sm">{emptyLabel}</p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-border border-b last:border-0">
                  <td className="text-text p-3">{row.label}</td>
                  <td className="text-text p-3 text-right font-medium tabular-nums">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
