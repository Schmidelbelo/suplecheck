"use client";

import Image from "next/image";
import { Link as LinkIcon, Trophy } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { toast } from "@/hooks/useToast";
import { buildComparisonNarrative } from "@core/index";
import { classificationLabel, classificationBadgeVariant } from "../lib/classification";
import type { RankingViewEntry } from "../types";

interface CompareRow {
  label: string;
  render: (entry: RankingViewEntry) => React.ReactNode;
  /** Valor numérico comparável desta linha para este produto — `null` quando não há dado. */
  value: (entry: RankingViewEntry) => number | null;
  /** Se o menor valor vence (preço) em vez do maior (nota). */
  lowerIsBetter?: boolean;
}

const ROWS: CompareRow[] = [
  {
    label: "Score Geral",
    value: (entry) => entry.overallScore,
    render: (entry) => (
      <span className="text-brand text-xl font-bold tabular-nums">
        {entry.overallScore.toFixed(1)}
      </span>
    ),
  },
  {
    label: "Índice SupleCheck (nota)",
    value: (entry) => entry.finalScore,
    render: (entry) => (
      <div className="flex items-center gap-2">
        <span className="text-text text-xl font-bold tabular-nums">
          {entry.finalScore.toFixed(1)}
        </span>
        <Badge variant={classificationBadgeVariant(entry.classificationTier)}>
          {classificationLabel(entry.classificationTier)}
        </Badge>
      </div>
    ),
  },
  {
    label: "Custo-benefício",
    value: (entry) => entry.criteriaScores["cost-benefit"] ?? null,
    render: (entry) =>
      entry.criteriaScores["cost-benefit"] != null
        ? entry.criteriaScores["cost-benefit"]!.toFixed(1)
        : "Não informado",
  },
  {
    label: "Preço",
    value: (entry) => entry.product.price?.cents ?? null,
    lowerIsBetter: true,
    render: (entry) =>
      entry.product.price ? formatCurrencyBRL(entry.product.price.cents) : "Não informado",
  },
  {
    label: "Preço por dose",
    value: (entry) => entry.product.price?.pricePerDoseCents ?? null,
    lowerIsBetter: true,
    render: (entry) =>
      entry.product.price?.pricePerDoseCents != null
        ? formatCurrencyBRL(entry.product.price.pricePerDoseCents)
        : "Não informado",
  },
  {
    label: "Posição no ranking",
    value: () => null,
    render: (entry) => `#${entry.position}`,
  },
  {
    label: "Apresentação",
    value: () => null,
    render: (entry) =>
      entry.product.sku
        ? `${entry.product.sku.variantLabel}${
            entry.product.sku.servingsPerUnit
              ? ` · ${entry.product.sku.servingsPerUnit} porções`
              : ""
          }`
        : "Não informado",
  },
  {
    label: "Loja",
    value: () => null,
    render: (entry) => entry.product.price?.store.name ?? "Não informado",
  },
];

/**
 * IDs dos produtos vencedores desta linha — só marca vencedor quando há
 * pelo menos 2 valores numéricos reais para comparar (evita destacar um
 * "vencedor" sozinho quando os outros produtos não têm o dado).
 */
function winnersOf(row: CompareRow, entries: readonly RankingViewEntry[]): Set<string> {
  const withValues = entries
    .map((entry) => ({ id: entry.product.id, value: row.value(entry) }))
    .filter((v): v is { id: string; value: number } => v.value != null);

  if (withValues.length < 2) return new Set();

  const best = row.lowerIsBetter
    ? Math.min(...withValues.map((v) => v.value))
    : Math.max(...withValues.map((v) => v.value));

  return new Set(withValues.filter((v) => v.value === best).map((v) => v.id));
}

export function CompareTable({
  entries,
  open,
  onOpenChange,
}: {
  entries: readonly RankingViewEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ variant: "success", title: "Link da comparação copiado" });
    } catch {
      toast({ variant: "danger", title: "Não foi possível copiar o link" });
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-3xl overflow-x-auto">
        <ModalHeader className="flex-row items-center justify-between gap-4 pr-8">
          <ModalTitle>Comparar produtos</ModalTitle>
          {entries.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <LinkIcon className="size-4" aria-hidden />
              Copiar link
            </Button>
          ) : null}
        </ModalHeader>

        {entries.length > 0 ? <ComparisonNarrativeBanner entries={entries} /> : null}

        {entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32" />
                  {entries.map((entry) => (
                    <th key={entry.product.id} className="p-2 text-left align-top">
                      <Image
                        src={entry.product.imageUrl ?? "/images/products/creatina-placeholder.svg"}
                        alt={entry.product.name}
                        width={56}
                        height={56}
                        className="border-border bg-bg-subtle mb-2 size-14 rounded-md border object-cover"
                      />
                      <p className="text-text-muted text-xs font-medium tracking-wide uppercase">
                        {entry.product.brand.name}
                      </p>
                      <p className="text-text text-sm leading-tight font-semibold">
                        {entry.product.name}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const winners = winnersOf(row, entries);
                  return (
                    <tr key={row.label} className="border-border border-t">
                      <th className="text-text-muted p-2 text-left align-middle text-xs font-medium">
                        {row.label}
                      </th>
                      {entries.map((entry) => {
                        const isWinner = winners.has(entry.product.id);
                        return (
                          <td
                            key={entry.product.id}
                            className={cn(
                              "p-2 align-middle",
                              isWinner && "bg-success/10 rounded-md",
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              {isWinner ? (
                                <Trophy
                                  className="text-success size-3.5 shrink-0"
                                  aria-label="Melhor valor entre os selecionados"
                                />
                              ) : null}
                              {row.render(entry)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-muted py-6 text-center text-sm">
            Selecione ao menos 2 produtos no ranking para comparar.
          </p>
        )}
      </ModalContent>
    </Modal>
  );
}

/**
 * Resumo em linguagem natural — `buildComparisonNarrative` (Core
 * Domain) já inclui a recomendação final, então substitui o antigo
 * banner "só vencedor geral" em vez de duplicá-lo ao lado.
 */
function ComparisonNarrativeBanner({ entries }: { entries: readonly RankingViewEntry[] }) {
  const sentences = buildComparisonNarrative(
    entries.map((e) => ({
      productId: e.product.id,
      name: e.product.name,
      priceCents: e.product.price?.cents ?? null,
      finalScore: e.finalScore,
      overallScore: e.overallScore,
    })),
  );
  if (sentences.length === 0) return null;

  return (
    <div className="bg-brand-subtle mb-4 flex flex-col gap-1.5 rounded-lg p-3 text-sm">
      {sentences.map((sentence) => (
        <span key={sentence} className="text-text flex items-start gap-2">
          <Trophy className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
          {sentence}
        </span>
      ))}
    </div>
  );
}
