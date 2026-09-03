/**
 * Utilitários genéricos de formatação. Reservado para funções puras,
 * sem dependência de domínio (isso vai em packages/core no futuro).
 */

export function formatCurrencyBRL(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function formatDate(date: Date | string, locale = "pt-BR"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * "há 5 minutos"/"há 2 dias" etc. — usado nas áreas de dados locais do
 * usuário (histórico de visitas, comparações recentes), onde a data
 * exata importa menos que "isso foi recente ou não".
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diffSeconds = Math.round((timestamp - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return rtf.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return rtf.format(diffSeconds, "second");
}

/**
 * "hoje"/"ontem"/"há 3 dias" — granularidade de DIA (não de hora/minuto
 * como `formatRelativeTime`), para a Timeline do Produto ("Você visitou
 * este produto: hoje/ontem/há X dias"). Compara início de dia local, não
 * diferença bruta de milissegundos — visitar às 23h e reabrir às 1h do
 * dia seguinte é "ontem", não "há poucas horas".
 */
export function formatRelativeDay(timestamp: number, now: number = Date.now()): string {
  const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfDay(timestamp) - startOfDay(now)) / (1000 * 60 * 60 * 24));
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  return rtf.format(diffDays, "day");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
