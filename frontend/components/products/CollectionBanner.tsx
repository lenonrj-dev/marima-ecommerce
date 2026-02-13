import Image from "next/image";
import { productListBanner } from "@/lib/productsData";

export default function CollectionBanner() {
  return (
    <section className="mt-[-25] bg-white pb-8">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mt-6 overflow-hidden rounded-3xl bg-zinc-100 shadow-soft">
          <div className="grid items-stretch gap-0 lg:grid-cols-12">
            <div className="relative h-[220px] w-full lg:col-span-7 lg:h-[260px]">
              <Image
                src={productListBanner.image}
                alt="Banner da coleção Marima"
                fill
                priority
                className="object-cover object-left"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>

            <div className="flex flex-col justify-center px-6 py-6 lg:col-span-5 lg:px-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                ⬢ {productListBanner.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-zinc-900 lg:text-[28px]">
                {productListBanner.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-600">{productListBanner.description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
