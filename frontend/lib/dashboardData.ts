export type DashboardNavKey = "overview" | "profile" | "favorites" | "address" | "orders";

export type DashboardNavItem = {
  label: string;
  href: string;
  key: DashboardNavKey;
};

export type DashboardProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  segment?: string;
};

export type DashboardOrderStatus =
  | "pendente"
  | "pago"
  | "separacao"
  | "enviado"
  | "entregue"
  | "cancelado"
  | "reembolsado"
  | "processando";

export type DashboardAddress = {
  id: string;
  label: string;
  fullName: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  complement?: string;
  isDefault?: boolean;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { key: "overview", label: "Minha conta", href: "/dashboard" },
  { key: "profile", label: "Dados pessoais", href: "/dashboard/dados-pessoais" },
  { key: "favorites", label: "Favoritos", href: "/dashboard/favoritos" },
  { key: "address", label: "Endereços", href: "/dashboard/endereco" },
  { key: "orders", label: "Pedidos", href: "/dashboard/pedidos" },
];

export function formatMoneyBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBR(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

export function statusLabel(status: DashboardOrderStatus) {
  switch (status) {
    case "pendente":
    case "separacao":
    case "processando":
      return "Processando";
    case "pago":
      return "Pago";
    case "enviado":
      return "Enviado";
    case "entregue":
      return "Entregue";
    case "cancelado":
      return "Cancelado";
    case "reembolsado":
      return "Reembolsado";
  }
}

export function statusTone(status: DashboardOrderStatus) {
  switch (status) {
    case "pendente":
    case "separacao":
    case "processando":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "pago":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "enviado":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "entregue":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "cancelado":
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
    case "reembolsado":
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
}
