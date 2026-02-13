import type { Order, Product } from "./types";

export function productStatusLabel(status: Product["status"]) {
  if (status === "novo") return "Novo";
  if (status === "destaque") return "Destaque";
  if (status === "oferta") return "Oferta";
  return "Padrão";
}

export function productStatusTone(status: Product["status"]) {
  if (status === "novo") return "info" as const;
  if (status === "destaque") return "success" as const;
  if (status === "oferta") return "warn" as const;
  return "neutral" as const;
}

export function orderStatusLabel(status: Order["status"]) {
  if (status === "pendente") return "Pendente";
  if (status === "pago") return "Pago";
  if (status === "separacao") return "Em separação";
  if (status === "enviado") return "Enviado";
  if (status === "entregue") return "Entregue";
  if (status === "reembolsado") return "Reembolsado";
  return "Cancelado";
}

export function orderStatusTone(status: Order["status"]) {
  if (status === "pago" || status === "entregue") return "success" as const;
  if (status === "pendente" || status === "separacao") return "warn" as const;
  if (status === "enviado") return "info" as const;
  if (status === "reembolsado" || status === "cancelado") return "danger" as const;
  return "neutral" as const;
}
