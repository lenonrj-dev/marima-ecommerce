import Container from "@/components/ui/Container";
import type { HelpTopicSlug } from "@/lib/helpData";
import HelpSidebar from "@/components/help/HelpSidebar";
import HelpContactCard from "@/components/help/HelpContactCard";

export default function HelpLayout({
  active,
  children,
}: {
  active: HelpTopicSlug;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white py-10 sm:py-12">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <HelpSidebar active={active} />
            <HelpContactCard />
          </div>

          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </section>
  );
}
