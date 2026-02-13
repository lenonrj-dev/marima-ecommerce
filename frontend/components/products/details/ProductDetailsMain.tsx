import type { ProductColorVariantsResponse, ProductListItem } from "@/lib/productsData";

import ProductGallery from "@/components/products/details/ProductGallery";
import ProductInfoPanel from "@/components/products/details/ProductInfoPanel";

export default function ProductDetailsMain({
  product,
  variants,
}: {
  product: ProductListItem;
  variants?: ProductColorVariantsResponse | null;
}) {
  return (
    <section className="bg-white pb-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <ProductGallery product={product} />
            <ProductInfoPanel product={product} variants={variants} />
          </div>
        </div>
      </div>
    </section>
  );
}

