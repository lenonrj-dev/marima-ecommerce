export const CLOUD_PRODUCT =
  "https://res.cloudinary.com/dxeooztro/image/upload/v1764855923/products/wm3vuf0hbfpmvf92ofma.png";

export const CLOUD_BANNER =
  "https://res.cloudinary.com/dpyrbbvjd/image/upload/v1768760004/AthleisureBanner_dzhuwp.png";

export type Product = { id : string;
  title: string;
  price: number;
  oldPrice?: number;
  badge?: "Novo" | "Oferta";
  image: string;
  rating: number;
};

export const trendingProducts: Product[] = [
  {
    id: "t1",
    title: "Legging Essential Compressão",
    price: 129.9,
    oldPrice: 169.9,
    badge: "Novo",
    image: CLOUD_PRODUCT,
    rating: 5,
  },
  {
    id: "t2",
    title: "Top Move Alta Sustentação",
    price: 99.9,
    oldPrice: 129.9,
    badge: "Oferta",
    image: CLOUD_PRODUCT,
    rating: 4,
  },
  {
    id: "t3",
    title: "Shorts Flex DryFit",
    price: 89.9,
    oldPrice: 109.9,
    badge: "Novo",
    image: CLOUD_PRODUCT,
    rating: 5,
  },
  {
    id: "t4",
    title: "Jaqueta Tech Run",
    price: 189.9,
    oldPrice: 249.9,
    badge: "Oferta",
    image: CLOUD_PRODUCT,
    rating: 4,
  },
];

export const bestSellingProducts: Product[] = [
  {
    id: "b1",
    title: "Conjunto Performance Pro",
    price: 219.9,
    oldPrice: 279.9,
    badge: "Novo",
    image: CLOUD_PRODUCT,
    rating: 5,
  },
  {
    id: "b2",
    title: "Regata Dry Fit Core",
    price: 79.9,
    oldPrice: 99.9,
    image: CLOUD_PRODUCT,
    rating: 4,
  },
  {
    id: "b3",
    title: "Legging Sculpt Fit",
    price: 139.9,
    oldPrice: 179.9,
    image: CLOUD_PRODUCT,
    rating: 5,
  },
  {
    id: "b4",
    title: "Jaqueta Corta-Vento Motion",
    price: 199.9,
    oldPrice: 259.9,
    badge: "Oferta",
    image: CLOUD_PRODUCT,
    rating: 4,
  },
  {
    id: "b5",
    title: "Top Pulse Média Sustentação",
    price: 89.9,
    oldPrice: 119.9,
    image: CLOUD_PRODUCT,
    rating: 5,
  },
  {
    id: "b6",
    title: "Calça Jogger Casual Active",
    price: 149.9,
    oldPrice: 189.9,
    image: CLOUD_PRODUCT,
    rating: 4,
  },
  {
    id: "b7",
    title: "Shorts Breeze Feminino",
    price: 84.9,
    oldPrice: 104.9,
    badge: "Novo",
    image: CLOUD_PRODUCT,
    rating: 4,
  },
  {
    id: "b8",
    title: "Conjunto Urban Comfort",
    price: 209.9,
    oldPrice: 269.9,
    image: CLOUD_PRODUCT,
    rating: 5,
  },
];

export const categories = [{ id : "c1", title: "Leggings", count: "32 peças", image: CLOUD_PRODUCT },
  { id: "c2", title: "Tops", count: "28 peças", image: CLOUD_PRODUCT },
  { id: "c3", title: "Novidades", count: "20 peças", image: CLOUD_PRODUCT },
  { id: "c4", title: "Conjuntos", count: "24 peças", image: CLOUD_PRODUCT },
  { id: "c5", title: "Mais vendidos", count: "15 peças", image: CLOUD_PRODUCT },
];
