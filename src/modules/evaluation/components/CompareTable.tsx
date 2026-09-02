"use client";

import Image from "next/image";
import { Link as LinkIcon } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrencyBRL } from "@/lib/utils/format";
import { toast } from "@/hooks/useToast";
import { classificationLabel, classificationBadgeVariant } from "../lib/classification";
import type { RankingViewEntry } from "../types";

const ROWS: { label: string; render: (entry: RankingViewEntry) => React.ReactNode }[] = [
  {
    label: "Índice SupleCheck",
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
    label: "Posição no ranking",
    render: (entry) => `#${entry.position}`,
  },
  {
    label: "Preço",
    render: (entry) =>
      entry.product.price ? formatCurrencyBRL(entry.product.price.cents) : "Não informado",
  },
  {
    label: "Preço por dose",
    render: (entry) =>
      entry.product.price?.pricePerDoseCents != null
        ? formatCurrencyBRL(entry.product.price.pricePerDoseCents)
        : "Não informado",
  },
  {
    label: "Apresentação",
    render: (entry) =>
      entry.product.sku
        ? `${entry.product.sku.variantLabel}${
            entry.product.sku.servingsPerUnit ? ` · ${entry.product.sku.servingsPerUnit} porções` : ""
          }`
        : "Não informado",
  },
  {
    label: "Loja",
    render: (entry) => entry.product.price?.store.name ?? "Não informado",
  },
];

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
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-border border-t">
                    <th className="text-text-muted p-2 text-left align-middle text-xs font-medium">
                      {row.label}
                    </th>
                    {entries.map((entry) => (
                      <td key={entry.product.id} className="p-2 align-middle">
                        {row.render(entry)}
                      </td>
                    ))}
                  </tr>
                ))}
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
