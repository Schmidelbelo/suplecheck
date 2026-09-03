import type { RecommendationPriority } from "@core/index";

export type TrainingLevel = "iniciante" | "intermediario" | "avancado";
export type Sex = "masculino" | "feminino";

/**
 * Perfil coletado pelo Assistente de Escolha. `priority`/`budget`/`goal`
 * alimentam o algoritmo real (via `/api/recommendation`); `age`/`sex`/
 * `trainingLevel`/`weeklyFrequency` são guardados só para preencher a
 * URL compartilhável e reabrir o assistente no mesmo ponto — nenhum
 * critério real do domínio os relaciona a pontuação hoje, então nunca
 * são enviados à API de recomendação (ver `recommendationData.service.ts`).
 */
export interface RecommendationProfileForm {
  readonly goal: string | null;
  readonly priority: RecommendationPriority;
  readonly budgetCents: number | null;
  readonly age: number | null;
  readonly sex: Sex | null;
  readonly trainingLevel: TrainingLevel | null;
  readonly weeklyFrequency: number | null;
}

export const DEFAULT_PROFILE: RecommendationProfileForm = {
  goal: null,
  priority: "costBenefit",
  budgetCents: null,
  age: null,
  sex: null,
  trainingLevel: null,
  weeklyFrequency: null,
};

const VALID_PRIORITIES: readonly RecommendationPriority[] = [
  "economy",
  "quality",
  "bestRating",
  "transparency",
  "costBenefit",
];
const VALID_TRAINING_LEVELS: readonly TrainingLevel[] = ["iniciante", "intermediario", "avancado"];
const VALID_SEXES: readonly Sex[] = ["masculino", "feminino"];

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

/** Serializa o perfil numa URL compartilhável — só inclui campos efetivamente preenchidos. */
export function encodeProfileToSearchParams(profile: RecommendationProfileForm): URLSearchParams {
  const params = new URLSearchParams();
  if (profile.goal) params.set("goal", profile.goal);
  params.set("priority", profile.priority);
  if (profile.budgetCents != null)
    params.set("budget", String(Math.round(profile.budgetCents / 100)));
  if (profile.age != null) params.set("age", String(profile.age));
  if (profile.sex) params.set("sex", profile.sex);
  if (profile.trainingLevel) params.set("level", profile.trainingLevel);
  if (profile.weeklyFrequency != null) params.set("frequency", String(profile.weeklyFrequency));
  return params;
}

/** Lê o perfil de volta de `URLSearchParams` — nunca lança: entrada inválida cai no default daquele campo. */
export function decodeProfileFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): RecommendationProfileForm {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    const value = params[key];
    return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
  };

  const priorityRaw = get("priority");
  const priority = VALID_PRIORITIES.includes(priorityRaw as RecommendationPriority)
    ? (priorityRaw as RecommendationPriority)
    : DEFAULT_PROFILE.priority;

  const trainingLevelRaw = get("level");
  const trainingLevel = VALID_TRAINING_LEVELS.includes(trainingLevelRaw as TrainingLevel)
    ? (trainingLevelRaw as TrainingLevel)
    : null;

  const sexRaw = get("sex");
  const sex = VALID_SEXES.includes(sexRaw as Sex) ? (sexRaw as Sex) : null;

  const budgetReais = parsePositiveInt(get("budget"));

  return {
    goal: get("goal"),
    priority,
    budgetCents: budgetReais != null ? budgetReais * 100 : null,
    age: parsePositiveInt(get("age")),
    sex,
    trainingLevel,
    weeklyFrequency: parsePositiveInt(get("frequency")),
  };
}

/** Perfil está completo o bastante para gerar uma recomendação (as demais respostas são opcionais). */
export function isProfileComplete(profile: RecommendationProfileForm): boolean {
  return profile.goal != null && profile.priority != null;
}
