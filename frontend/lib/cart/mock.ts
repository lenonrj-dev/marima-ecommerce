// Placeholders para upsell / cross-sell (trocar por dados do backend).

const PRODUCT_IMG =
  "https://res.cloudinary.com/dxeooztro/image/upload/v1764855923/products/wm3vuf0hbfpmvf92ofma.png";

export const UPSELLS = [
  {
    id: "upsell-top-pulse",
    name: "Top Pulse Alta Sustentao",
    description: "Mais estabilidade e conforto para treinos intensos.",
    price: 6990,
    compareAtPrice: 8990,
    imageUrl: PRODUCT_IMG,
    badge: "Destaque",
  },
  {
    id: "upsell-shorts-flex",
    name: "Shorts Flex Performance",
    description: "Leve, respirvel e com timo caimento.",
    price: 7990,
    compareAtPrice: 9990,
    imageUrl: PRODUCT_IMG,
    badge: "Oferta",
  },
] as const;

export const CROSS_SELL = [
  {
    id: "cross-regata-core",
    name: "Regata Dry Fit Core",
    description: "Combina com legging, shorts e conjuntos.",
    price: 5990,
    imageUrl: PRODUCT_IMG,
    badge: "Combo",
  },
  {
    id: "cross-jaqueta-active",
    name: "Jaqueta Corta-Vento Active",
    description: "Ideal para pr e ps-treino.",
    price: 14990,
    imageUrl: PRODUCT_IMG,
    badge: "Novo",
  },
] as const;
