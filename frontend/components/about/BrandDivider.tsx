import Container from "@/components/ui/Container";

import { ABOUT_COPY } from "@/lib/aboutData";

export default function BrandDivider() {
  return (
    <section className="bg-white py-6">
      <Container>
        <div className="flex items-center gap-6">
          <div className="h-px flex-1 bg-zinc-200" />

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e37a33]">
            {ABOUT_COPY.collection.kicker}
          </p>

          <div className="h-px flex-1 bg-zinc-200" />
        </div>
      </Container>
    </section>
  );
}
