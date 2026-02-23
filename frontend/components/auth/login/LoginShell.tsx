import Container from "@/components/ui/Container";
import LoginCard from "@/components/auth/login/LoginCard";

export default function LoginShell({ reason, nextPath }: { reason?: string; nextPath?: string }) {
  return (
    <section className="min-h-[calc(100dvh-120px)] bg-white py-10 sm:py-14 lg:py-16">
      <Container className="h-full">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-center">
          <div className="w-full max-w-[520px] md:min-h-[520px]">
            <LoginCard reason={reason} nextPath={nextPath} />
          </div>
        </div>
      </Container>
    </section>
  );
}
