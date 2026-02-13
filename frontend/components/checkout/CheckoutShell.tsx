import Container from "@/components/ui/Container";

export default function CheckoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white py-10 sm:py-12">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          {children}
        </div>
      </Container>
    </section>
  );
}
