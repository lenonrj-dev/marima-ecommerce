import Container from "@/components/ui/Container";
import LoginCard from "@/components/auth/login/LoginCard";

export default function LoginShell({ reason, nextPath }: { reason?: string; nextPath?: string }) {
  return (
    <section className="relative overflow-hidden bg-zinc-950/5 py-10 sm:py-14 lg:py-16">
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url(https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771336414/MARIMA._sybawl.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <Container>
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-8 md:grid-cols-12 md:items-start">
            <div className="md:col-span-7">
              <div className="space-y-6">
                <div className="w-full max-w-[520px] md:min-h-[520px]">
                  <LoginCard reason={reason} nextPath={nextPath} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
