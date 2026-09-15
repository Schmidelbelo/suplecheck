"use client";

import * as React from "react";
import { UploadCloud, KeyRound, ImageOff, CloudUpload, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/hooks/useToast";
import { formatRelativeTime } from "@/lib/utils/format";

const API_KEY_SESSION_KEY = "suplescore:admin-api-key";

type PendingStatus = "PENDING" | "APPROVED" | "REJECTED";

interface PendingImageItem {
  id: string;
  productId: string;
  slug: string;
  productName: string;
  brandName: string;
  categoryName: string;
  status: PendingStatus;
  sourceUrl: string | null;
  candidateUrl: string | null;
  confidence: number | null;
  width: number | null;
  height: number | null;
  source: string | null;
  reason: string;
  createdAt: string;
}

const STATUS_LABEL: Record<PendingStatus, string> = {
  PENDING: "Sem candidato",
  APPROVED: "Aprovado — pronto pra publicar",
  REJECTED: "Rejeitado",
};
const STATUS_VARIANT: Record<PendingStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

/**
 * "Central de Imagens" — fila em duas fases (Descoberta → Publicação).
 * Cada linha mostra o candidato completo (URL, confiança, resolução,
 * fonte) pra decidir publicar em lote (todo `APPROVED` de uma vez) ou
 * caso a caso, além do upload manual (drag-and-drop) pra quem não tem
 * candidato nenhum. Mesmo padrão de autenticação de `AdminJobsClient`
 * (API Key em sessionStorage, nunca persistida).
 */
export function ImageCentralClient() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [keyInput, setKeyInput] = React.useState("");
  const [authError, setAuthError] = React.useState(false);
  const [items, setItems] = React.useState<PendingImageItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [publishingAll, setPublishingAll] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(API_KEY_SESSION_KEY);
      if (stored) setApiKey(stored);
    } catch {
      // sessionStorage indisponível — segue exigindo digitar a chave.
    }
  }, []);

  const fetchPending = React.useCallback(async (key: string) => {
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch("/api/admin/images/pending", { headers: { "x-api-key": key } });
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
      const body = await res.json();
      setItems(body.items);
      if (body.guardrail && (body.guardrail.queued > 0 || body.guardrail.cleaned > 0)) {
        toast({
          variant: "default",
          title: "Guardrail ajustou a fila",
          description: `${body.guardrail.queued} produto(s) enfileirado(s), ${body.guardrail.cleaned} órfão(s) limpo(s).`,
        });
      }
    } catch {
      toast({ variant: "danger", title: "Não foi possível carregar a fila de imagens" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (apiKey) void fetchPending(apiKey);
  }, [apiKey, fetchPending]);

  function submitKey() {
    if (!keyInput.trim()) return;
    try {
      window.sessionStorage.setItem(API_KEY_SESSION_KEY, keyInput.trim());
    } catch {
      // ignora — sessão atual ainda funciona só em memória.
    }
    setApiKey(keyInput.trim());
  }

  async function publishOne(item: PendingImageItem) {
    if (!apiKey) return;
    try {
      const res = await fetch("/api/admin/images/publish", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ pendingImageId: item.id }),
      });
      const body = await res.json();
      if (!res.ok || body.status !== "published") {
        throw new Error(body.reason ?? body.message ?? `HTTP ${res.status}`);
      }
      toast({ variant: "success", title: `Publicado: ${item.productName}` });
      setItems((prev) => (prev ? prev.filter((p) => p.id !== item.id) : prev));
    } catch (error) {
      toast({
        variant: "danger",
        title: "Falha ao publicar",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function publishAll() {
    if (!apiKey) return;
    setPublishingAll(true);
    try {
      const res = await fetch("/api/admin/images/publish-all", {
        method: "POST",
        headers: { "x-api-key": apiKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      toast({
        variant: "success",
        title: `${body.published} publicada(s)`,
        description:
          body.skipped > 0 ? `${body.skipped} não publicada(s) — veja o console.` : undefined,
      });
      await fetchPending(apiKey);
    } catch {
      toast({ variant: "danger", title: "Falha ao publicar em lote" });
    } finally {
      setPublishingAll(false);
    }
  }

  async function uploadImage(item: PendingImageItem, file: File) {
    if (!apiKey) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "danger", title: "Selecione um arquivo de imagem" });
      return;
    }
    const form = new FormData();
    form.append("productId", item.productId);
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/images/upload", {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `HTTP ${res.status}`);
      }
      toast({ variant: "success", title: `Imagem salva para ${item.productName}` });
      setItems((prev) => (prev ? prev.filter((p) => p.id !== item.id) : prev));
    } catch (error) {
      toast({
        variant: "danger",
        title: "Falha ao enviar imagem",
        description: error instanceof Error ? error.message : undefined,
      });
    }
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

  if (loading && !items) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (items && items.length === 0) {
    return (
      <EmptyState
        icon={<ImageOff aria-hidden />}
        title="Fila vazia"
        description="Todo produto publicado já tem uma imagem oficial local. Novos produtos sem imagem encontrada automaticamente aparecem aqui."
      />
    );
  }

  const approvedCount = items?.filter((i) => i.status === "APPROVED").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted text-sm">
          {items?.length ?? 0} produto{items?.length === 1 ? "" : "s"} na fila — {approvedCount}{" "}
          aprovado{approvedCount === 1 ? "" : "s"} pronto{approvedCount === 1 ? "" : "s"} pra
          publicar.
        </p>
        {approvedCount > 0 ? (
          <Button onClick={publishAll} disabled={publishingAll} className="gap-2">
            <Rocket className="size-4" aria-hidden />
            {publishingAll ? "Publicando..." : `Publicar todos os aprovados (${approvedCount})`}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <PendingImageCard
            key={item.id}
            item={item}
            onUpload={uploadImage}
            onPublish={publishOne}
          />
        ))}
      </div>
    </div>
  );
}

function PendingImageCard({
  item,
  onUpload,
  onPublish,
}: {
  item: PendingImageItem;
  onUpload: (item: PendingImageItem, file: File) => Promise<void>;
  onPublish: (item: PendingImageItem) => Promise<void>;
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      await onUpload(item, file);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    setBusy(true);
    try {
      await onPublish(item);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-text truncate text-sm font-semibold">{item.productName}</p>
          <p className="text-text-muted text-xs">
            {item.brandName} · {item.categoryName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={STATUS_VARIANT[item.status]} className="text-xs">
            {STATUS_LABEL[item.status]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatRelativeTime(new Date(item.createdAt).getTime())}
          </Badge>
        </div>

        {item.status === "APPROVED" && item.candidateUrl ? (
          <div className="border-border bg-bg-subtle flex flex-col gap-1 rounded-md border p-2 text-xs">
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia de URL externa ainda não publicada, não é o Image do catálogo */}
            <img
              src={item.candidateUrl}
              alt={item.productName}
              className="mx-auto h-32 w-32 rounded object-contain"
            />
            <p className="text-text-muted">
              confiança {item.confidence?.toFixed(2)} · {item.width}×{item.height} · {item.source}
            </p>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand truncate hover:underline"
              >
                {item.sourceUrl}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-text-subtle text-xs">{item.reason}</p>
        )}

        {item.status === "APPROVED" ? (
          <Button onClick={handlePublish} disabled={busy} size="sm" className="gap-2">
            <CloudUpload className="size-4" aria-hidden />
            {busy ? "Publicando..." : "Publicar no Blob"}
          </Button>
        ) : null}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          disabled={busy}
          className={`border-border flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition-colors ${
            dragOver ? "border-brand bg-brand/5" : "hover:bg-bg-muted"
          }`}
        >
          <UploadCloud className="text-text-subtle size-5" aria-hidden />
          <span className="text-text-muted text-xs">
            {busy ? "Enviando..." : "Ou envie manualmente (arraste ou clique)"}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </CardContent>
    </Card>
  );
}
