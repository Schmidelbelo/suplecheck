"use client";

import * as React from "react";
import { KeyRound, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { formatCurrencyBRL } from "@/lib/utils/format";
import type {
  MonetizationAudit,
  MonetizationBlockReason,
} from "@/modules/monetization/services/monetizationAudit.service";

const API_KEY_SESSION_KEY = "suplescore:admin-api-key";

const REASON_LABEL: Record<MonetizationBlockReason, string> = {
  STORE_NOT_AFFILIATE: "Loja não é afiliada",
  MISSING_AFFILIATE_URL: "Falta link/tag de afiliado",
  MISSING_PRICE_URL: "Falta URL da oferta capturada",
};

/**
 * Painel "Cobertura de Monetização" — mesmo padrão de autenticação de
 * `AdminJobsClient`/`ImageCentralClient` (API Key em sessionStorage).
 * Nunca inventa link nenhum: só lê `getMonetizationAudit()`, a mesma
 * lógica de `buildAffiliateUrl` usada no redirect real de `/go`.
 */
export function MonetizationAuditClient() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [keyInput, setKeyInput] = React.useState("");
  const [authError, setAuthError] = React.useState(false);
  const [audit, setAudit] = React.useState<MonetizationAudit | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(API_KEY_SESSION_KEY);
      if (stored) setApiKey(stored);
    } catch {
      // sessionStorage indisponível — segue exigindo digitar a chave.
    }
  }, []);

  const fetchAudit = React.useCallback(async (key: string) => {
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch("/api/admin/monetization", { headers: { "x-api-key": key } });
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
      setAudit(await res.json());
    } catch {
      toast({ variant: "danger", title: "Não foi possível carregar a auditoria de monetização" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (apiKey) void fetchAudit(apiKey);
  }, [apiKey, fetchAudit]);

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

  if (loading && !audit) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!audit) return null;

  const coveragePct =
    audit.productsTotal > 0 ? (audit.productsMonetized / audit.productsTotal) * 100 : 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Cobertura geral" value={`${coveragePct.toFixed(1)}%`} />
        <StatTile label="Produtos monetizados" value={String(audit.productsMonetized)} />
        <StatTile
          label="Com preço, sem monetizar"
          value={String(audit.productsWithPriceNotMonetized)}
          tone="warning"
        />
        <StatTile label="Sem nenhum preço" value={String(audit.productsWithoutAnyPrice)} />
      </div>

      {audit.recommendedActions.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-text flex items-center gap-2 text-lg font-bold">
            <TrendingUp className="size-5" aria-hidden />
            Próxima ação comercial recomendada
          </h2>
          <div className="flex flex-col gap-2">
            {audit.recommendedActions.map((action) => (
              <Card key={action.storeSlug} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-text font-semibold">{action.storeName}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={action.effort === "low" ? "success" : "warning"}>
                      esforço {action.effort === "low" ? "baixo" : "médio"}
                    </Badge>
                    <Badge variant="brand">+{action.productsUnlocked} produtos</Badge>
                  </div>
                </div>
                <p className="text-text-muted mt-1 text-sm">{action.description}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-text text-lg font-bold">Cobertura por loja</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-text-muted border-b text-left">
                <th className="py-2 pr-4">Loja</th>
                <th className="py-2 pr-4">Afiliada?</th>
                <th className="py-2 pr-4">Link configurado?</th>
                <th className="py-2 pr-4">Monetizados</th>
                <th className="py-2 pr-4">Bloqueados</th>
                <th className="py-2 pr-4">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {audit.storeCoverage.map((s) => (
                <tr key={s.storeSlug} className="border-border border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{s.storeName}</td>
                  <td className="py-2 pr-4">{s.isAffiliate ? "Sim" : "Não"}</td>
                  <td className="py-2 pr-4">{s.hasAffiliateUrl ? "Sim" : "Não"}</td>
                  <td className="text-success py-2 pr-4 font-semibold">{s.offersMonetized}</td>
                  <td className="py-2 pr-4">
                    {s.offersBlocked > 0 ? (
                      <span className="text-danger font-semibold">{s.offersBlocked}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {s.blockReason ? (
                      <Badge variant="warning">{REASON_LABEL[s.blockReason]}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-text text-lg font-bold">Cobertura por categoria</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {audit.categoryCoverage.map((c) => {
            const pct = c.productsTotal > 0 ? (c.productsMonetized / c.productsTotal) * 100 : 0;
            return (
              <Card key={c.categorySlug} className="p-4">
                <p className="text-text font-semibold">{c.categoryName}</p>
                <p className="text-text-muted text-sm">
                  {c.productsMonetized}/{c.productsTotal} monetizados ({pct.toFixed(0)}%)
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-text flex items-center gap-2 text-lg font-bold">
          <AlertTriangle className="size-5" aria-hidden />
          Produtos com preço mas sem monetização ({audit.blockedOffers.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-text-muted border-b text-left">
                <th className="py-2 pr-4">Produto</th>
                <th className="py-2 pr-4">Loja</th>
                <th className="py-2 pr-4">Preço</th>
                <th className="py-2 pr-4">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {audit.blockedOffers.slice(0, 100).map((offer, i) => (
                <tr
                  key={`${offer.productId}-${offer.storeSlug}-${i}`}
                  className="border-border border-b last:border-0"
                >
                  <td className="py-2 pr-4">{offer.productName}</td>
                  <td className="py-2 pr-4">{offer.storeName}</td>
                  <td className="py-2 pr-4 tabular-nums">{formatCurrencyBRL(offer.priceCents)}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="danger">{REASON_LABEL[offer.reason]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {audit.blockedOffers.length > 100 ? (
            <p className="text-text-subtle mt-2 text-xs">
              Mostrando os 100 de maior valor — {audit.blockedOffers.length - 100} adicionais não
              exibidos.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <Card className="p-4">
      <p className="text-text-muted text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "warning" ? "text-warning" : "text-text"}`}>
        {value}
      </p>
    </Card>
  );
}
