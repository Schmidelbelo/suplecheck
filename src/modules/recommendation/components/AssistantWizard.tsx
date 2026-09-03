"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PROFILE,
  encodeProfileToSearchParams,
  type RecommendationProfileForm,
  type Sex,
  type TrainingLevel,
} from "../lib/profileQuery";
import type { RecommendationPriority } from "@core/index";

const GOAL_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: "ganho-de-massa",
    label: "Ganho de massa / força",
    description: "Foco em hipertrofia e performance de força.",
  },
  {
    value: "performance",
    label: "Performance / resistência",
    description: "Melhorar desempenho em treinos intensos.",
  },
  {
    value: "recuperacao",
    label: "Recuperação",
    description: "Apoiar recuperação entre sessões de treino.",
  },
];

const PRIORITY_OPTIONS: { value: RecommendationPriority; label: string; description: string }[] = [
  { value: "economy", label: "Economia", description: "Priorizar o menor preço e preço por dose." },
  {
    value: "quality",
    label: "Qualidade",
    description: "Priorizar a nota técnica (Índice SupleCheck).",
  },
  {
    value: "bestRating",
    label: "Melhor nota",
    description: "Maximizar a nota, quase sem considerar preço.",
  },
  {
    value: "transparency",
    label: "Transparência",
    description: "Priorizar rótulos mais claros e sem omissões.",
  },
  { value: "costBenefit", label: "Custo-benefício", description: "Equilíbrio entre nota e preço." },
];

const TRAINING_LEVEL_OPTIONS: { value: TrainingLevel; label: string }[] = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
];

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
];

function OptionCard({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "border-border hover:border-brand flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors",
        selected && "border-brand bg-brand-subtle",
      )}
    >
      <span className="text-text text-sm font-semibold">{label}</span>
      {description ? <span className="text-text-muted text-xs">{description}</span> : null}
    </button>
  );
}

const STEP_COUNT = 4;

/** Fluxo em etapas do Assistente de Escolha — ao final, navega para `/assistente?...` com o perfil serializado na URL (compartilhável, sem banco, sem login). */
export function AssistantWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [profile, setProfile] = React.useState<RecommendationProfileForm>(DEFAULT_PROFILE);

  const canAdvance = step === 0 ? profile.goal != null : true;

  function goToRecommendation() {
    const params = encodeProfileToSearchParams(profile);
    router.push(`/assistente?${params.toString()}`);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
          {Array.from({ length: STEP_COUNT }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index <= step ? "bg-brand" : "bg-bg-muted",
              )}
            />
          ))}
        </div>

        {step === 0 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-text text-lg font-semibold">Qual seu objetivo principal?</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {GOAL_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  description={opt.description}
                  selected={profile.goal === opt.value}
                  onClick={() => setProfile((p) => ({ ...p, goal: opt.value }))}
                />
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-text text-lg font-semibold">O que é mais importante para você?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  description={opt.description}
                  selected={profile.priority === opt.value}
                  onClick={() => setProfile((p) => ({ ...p, priority: opt.value }))}
                />
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-text text-lg font-semibold">Qual seu orçamento? (opcional)</h2>
            <p className="text-text-muted text-sm">
              Produtos acima deste valor não entram na recomendação, quando o preço é conhecido.
            </p>
            <Input
              type="number"
              min={1}
              placeholder="Ex.: 100"
              value={profile.budgetCents != null ? profile.budgetCents / 100 : ""}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  budgetCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
                }))
              }
              className="max-w-xs"
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-text text-lg font-semibold">Sobre você (opcional)</h2>
              <p className="text-text-muted text-sm">
                Estas respostas não alteram a recomendação hoje — não existe nenhum critério real
                associando idade, sexo ou nível de treino a nota ou preço. Ficam salvas só para
                reabrir esta mesma busca depois.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-text-muted">Idade</span>
                <Input
                  type="number"
                  min={1}
                  value={profile.age ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      age: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-text-muted">Frequência semanal de treino</span>
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={profile.weeklyFrequency ?? ""}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      weeklyFrequency: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-text-muted text-sm">Nível de treino</span>
              <div className="flex flex-wrap gap-2">
                {TRAINING_LEVEL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        trainingLevel: p.trainingLevel === opt.value ? null : opt.value,
                      }))
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      profile.trainingLevel === opt.value
                        ? "border-brand bg-brand-subtle text-brand"
                        : "border-border text-text-muted",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-text-muted text-sm">Sexo</span>
              <div className="flex flex-wrap gap-2">
                {SEX_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({ ...p, sex: p.sex === opt.value ? null : opt.value }))
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm",
                      profile.sex === opt.value
                        ? "border-brand bg-brand-subtle text-brand"
                        : "border-border text-text-muted",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Voltar
          </Button>
          {step < STEP_COUNT - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              Próximo
            </Button>
          ) : (
            <Button onClick={goToRecommendation}>Ver recomendação</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
