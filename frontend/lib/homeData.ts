export const CLOUD_PRODUCT =
  "https://res.cloudinary.com/dxeooztro/image/upload/v1764855923/products/wm3vuf0hbfpmvf92ofma.png";

export const CLOUD_BANNER =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771251149/BannerWide_gfyf5r.png";

  export const LOOK_BANNER =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771251723/Lookbook1_w3vpck.png";

  export const LOOK_BANNER2 =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771251812/Lookbook2_aoyxxa.png";

    export const DEAL_BANNER2 =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771257211/Dealofday_ssilaf.png";

  export const HERO_BANNER =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771267903/hero_x71ibq.png";

export type Product = { id : string;
  title: string;
  price: number;
  oldPrice?: number;
  badge?: "Novo" | "Oferta";
  image: string;
  rating: number;
};


export const categories = [{ id : "c1", title: "Leggings", count: "32 peças", image: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771269804/Leggings_q48fbp.png" },
  { id: "c2", title: "Tops", count: "28 peças", image: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771269721/Tops_1_yg9rad.png" },
  { id: "c3", title: "Novidades", count: "20 peças", image: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771269233/Novidades_mnatql.png" },
  { id: "c4", title: "Conjuntos", count: "24 peças", image: 'https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771268975/Conjuntos_1_zne8oz.png' },
  { id: "c5", title: "Mais vendidos", count: "15 peças", image: "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771269132/MaisVendidos_1_ezyz69.png" },
];
