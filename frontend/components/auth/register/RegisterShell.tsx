import Container from "@/components/ui/Container";
import RegisterCard from "@/components/auth/register/RegisterCard";

export default function RegisterShell() {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950/5 py-10 sm:py-14 lg:py-16"
      aria-label="Cadastro"
    >
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771336414/MARIMA._sybawl.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      <div className="pointer-events-none absolute inset-0" aria-hidden>
      </div>
      <Container>
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-8 md:grid-cols-12 md:items-start">
            <div className="md:col-span-7">
              <div className="space-y-6">
                <div className="w-full max-w-[520px] md:min-h-[520px]">
                <RegisterCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
