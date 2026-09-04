"use client";

import * as React from "react";
import { RefreshCw, Play, KeyRound, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { formatRelativeTime } from "@/lib/utils/format";

const API_KEY_SESSION_KEY = "suplescore:admin-api-key";

interface JobBatch {
  id: string;
  source: string;
  status: string;
  totalRecords: number;
  importedRecords: number;
  failedRecords: number;
  startedAt: string;
  finishedAt: string | null;
}

const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "default"> = {
  COMPLETED: "success",
  FAILED: "danger",
  COMPLETED_WITH_ERRORS: "warning",
  PROCESSING: "default",
  PENDING: "default",
};

/**
 * Só client component porque precisa da API Key inserida pelo admin
 * (não há login — a mesma `ADMIN_API_KEY` já usada pelas rotas de
 * escrita) para chamar `/api/admin/jobs`, protegido em todo método
 * (inclusive GET) por `src/middleware.ts`. A chave fica só em
 * `sessionStorage` (não `localStorage`): expira ao fechar a aba, nunca
 * persiste entre sessões.
 */
export function AdminJobsClient() {
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [keyInput, setKeyInput] = React.useState("");
  const [batches, setBatches] = React.useState<JobBatch[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [authError, setAuthError] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(API_KEY_SESSION_KEY);
      if (stored) setApiKey(stored);
    } catch {
      // sessionStorage indisponível — segue exigindo digitar a chave a cada carregamento.
    }
  }, []);

  const fetchBatches = React.useCallback(async (key: string) => {
    setLoading(true);
    setAuthError(false);
    try {
      const res = await fetch("/api/admin/jobs?source=price-capture-job", {
        headers: { "x-api-key": key },
      });
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
      setBatches(await res.json());
    } catch {
      toast({ variant: "danger", title: "Não foi possível carregar os jobs" });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (apiKey) void fetchBatches(apiKey);
  }, [apiKey, fetchBatches]);

  function submitKey() {
    if (!keyInput.trim()) return;
    try {
      window.sessionStorage.setItem(API_KEY_SESSION_KEY, keyInput.trim());
    } catch {
      // ignora — sessão atual ainda funciona só em memória.
    }
    setApiKey(keyInput.trim());
  }

  async function runNow() {
    if (!apiKey) return;
    setRunning(true);
    try {
      const res = await fetch("/api/admin/jobs/price-capture", {
        method: "POST",
        headers: { "x-api-key": apiKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ variant: "success", title: "Job executado" });
      await fetchBatches(apiKey);
    } catch {
      toast({ variant: "danger", title: "Falha ao executar o job" });
    } finally {
      setRunning(false);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBatches(apiKey)}
          className="gap-1.5"
        >
          <RefreshCw className="size-4" aria-hidden />
          Atualizar
        </Button>
        <Button size="sm" onClick={runNow} isLoading={running} className="gap-1.5">
          <Play className="size-4" aria-hidden />
          Rodar agora
        </Button>
      </div>

      {loading && !batches ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : !batches || batches.length === 0 ? (
        <p className="text-text-muted text-sm">Nenhuma execução registrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  {batch.status === "COMPLETED" ? (
                    <CheckCircle2 className="text-success size-5" aria-hidden />
                  ) : batch.status === "FAILED" ? (
                    <XCircle className="text-danger size-5" aria-hidden />
                  ) : (
                    <Clock className="text-warning size-5" aria-hidden />
                  )}
                  <div>
                    <p className="text-text text-sm font-medium">
                      {formatRelativeTime(new Date(batch.startedAt).getTime())}
                    </p>
                    <p className="text-text-muted text-xs">
                      {batch.importedRecords} processados · {batch.failedRecords} falhas ·{" "}
                      {batch.finishedAt
                        ? `${(
                            (new Date(batch.finishedAt).getTime() -
                              new Date(batch.startedAt).getTime()) /
                            1000
                          ).toFixed(1)}s`
                        : "em andamento"}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[batch.status] ?? "default"}>{batch.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
