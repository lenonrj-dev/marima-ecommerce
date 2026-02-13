export function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

export function formatPct(value01: number, digits = 2) {
  const v = Math.max(0, Math.min(1, value01));
  return `${(v * 100).toFixed(digits)}%`;
}

export function formatDateShort(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

export function formatCompactNumber(n: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}

export function formatCategoryLabel(value: string) {
  const key = String(value || "").trim().toLocaleLowerCase("pt-BR");

  if (key === "fitness") return "Fitness";
  if (key === "moda") return "Moda";
  if (key === "casual") return "Casual";
  if (key === "acessorios") return "Casual";
  if (key === "suplementos") return "Suplementos";
  if (key === "outros") return "Outros";

  return value;
}
