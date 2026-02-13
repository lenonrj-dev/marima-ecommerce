import Image from "next/image";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import Container from "@/components/ui/Container";

import { ABOUT_COPY, ABOUT_IMAGES } from "@/lib/aboutData";



export default function LatestCollection() {

  return (

    <section className="bg-white py-14 sm:py-16">

      <Container>

        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">

          {/* Left image */}

          <div className="overflow-hidden rounded-3xl bg-zinc-100 shadow-soft ring-1 ring-black/5">

            <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">

              <Image
                src={ABOUT_IMAGES.collectionMain}
                alt="Coleção Marima"
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 38vw, 100vw"
              />

            </div>

          </div>



          {/* Right content */}

          <div className="space-y-6">

            <h3 className="whitespace-pre-line font-serif text-4xl leading-tight text-zinc-900 sm:text-5xl">

              {ABOUT_COPY.collection.title}

            </h3>



            <p className="max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">

              {ABOUT_COPY.collection.description}

            </p>



            <div className="flex flex-wrap gap-2">

              {ABOUT_COPY.collection.chips.map((c) => (

                <button

                  key={c}

                  type="button"

                  className="h-9 rounded-md border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"

                >

                  {c}

                </button>

              ))}

            </div>



            <Link

              href="/produtos"

              className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-900 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"

            >

              {ABOUT_COPY.collection.link}

              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e37a33] text-white">

                <ArrowRight className="h-4 w-4" />

              </span>

            </Link>

          </div>

        </div>

      </Container>

    </section>

  );

}



