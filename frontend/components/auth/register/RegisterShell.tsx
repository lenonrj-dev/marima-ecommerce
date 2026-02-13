import Container from "@/components/ui/Container";
import { LOGIN_BG } from "@/lib/loginData";
import PromoCard from "@/components/auth/login/PromoCard";
import EventCards from "@/components/auth/login/EventCards";
import RegisterCard from "@/components/auth/register/RegisterCard";

export default function RegisterShell() {
  return (
    <section
      className="relative overflow-hidden bg-zinc-950/5 py-10 sm:py-14 lg:py-16"
      aria-label="Cadastro"
    >
      {/* Background image */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url(${LOGIN_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-white/70" aria-hidden />

      {/* Soft blur bubbles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-36 top-10 h-[560px] w-[560px] rounded-full bg-white/55 blur-2xl" />
        <div className="absolute -right-44 top-8 h-[560px] w-[560px] rounded-full bg-white/55 blur-2xl" />
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff8a3a]/20 blur-3xl" />
        <div className="absolute bottom-[-160px] left-28 h-[380px] w-[380px] rounded-full bg-white/60 blur-3xl" />
      </div>

      <Container>
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 md:grid-cols-12 md:items-start">
            {/* Left */}
            <div className="md:col-span-7">
              <div className="space-y-6">
                <RegisterCard />
                <PromoCard />
              </div>
            </div>

            {/* Right */}
            <div className="md:col-span-5">
              <EventCards />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
