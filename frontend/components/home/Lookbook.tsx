import Container from "@/components/ui/Container";

import SectionHeading from "@/components/ui/SectionHeading";

import Image from "next/image";

import { LOOK_BANNER, LOOK_BANNER2 } from "@/lib/homeData";



export default function Lookbook() {
  return (
    <section className="bg-white py-12">
      <Container>
        <SectionHeading
          title="Inspire-se com o lookbook"
          subtitle="Combinaes fitness e casual para acompanhar sua rotina com estilo."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl bg-zinc-100">
            <Image src={LOOK_BANNER} alt="Lookbook Marima 1" fill className="object-cover" />
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl bg-zinc-100">
            <Image src={LOOK_BANNER2} alt="Lookbook Marima 2" fill className="object-cover" />
          </div>
        </div>
      </Container>
    </section>
  );

}

