export function toCents(value: number) {
  return Math.round(value * 100);
}

export function fromCents(value: number) {
  return Number((value / 100).toFixed(2));
}

export function ensureCents(value: number) {
  return Math.max(0, Math.round(value));
}
