import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import FooterNewsletterForm from "@/components/layout/FooterNewsletterForm";
import { SITE_COPY } from "@/lib/siteCopy";

const CURRENT_YEAR = 2026;

const logoSrc =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1772142515/MARIMA._2_njmiac.png";

const ateliuxLogoSrc =
  "https://res.cloudinary.com/df4wjugxk/image/upload/v1772142334/Ateliux_Logo_kuv8bo.png";

export default function SiteFooter() {
  return (
    <footer className="bg-white">
      <Container>
        <div className="grid gap-10 border-t border-zinc-100 py-12 md:grid-cols-4">
          <div>
            <Link href="/" aria-label={`${SITE_COPY.brand} - Início`} className="inline-flex">
              <span className="relative inline-flex items-center">
                <Image
                  src={logoSrc}
                  alt={SITE_COPY.brand}
                  width={160}
                  height={42}
                  priority
                  className="h-auto w-[160px] select-none"
                />
              </span>
            </Link>

            <p className="mt-3 text-sm text-zinc-500">
              Moda Fitness & Casual com foco em qualidade, conforto, performance e compra segura.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900">Navegação</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>
                <Link className="hover:underline" href="/">
                  Início
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/produtos">
                  Loja
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/blog">
                  Blog
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/sobre">
                  Sobre
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/central-de-ajuda">
                  Ajuda
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/central-de-ajuda/privacidade">
                  Privacidade e cookies
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900">Minha conta</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>
                <Link className="hover:underline" href="/dashboard">
                  Minha conta
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/dashboard/favoritos">
                  Favoritos
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/dashboard/endereco">
                  Endereços
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/dashboard/pedidos">
                  Pedidos
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  disabled
                  aria-disabled
                  title="Sair em breve"
                  className="cursor-not-allowed text-zinc-500"
                >
                  Sair
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900">Novidades Marima</p>
            <p className="mt-3 text-sm text-zinc-500">Receba lançamentos e ofertas em primeira mão.</p>
            <FooterNewsletterForm />

            <div className="mt-5 flex justify-center md:mt-20 md:justify-start">
              <Link
                href="https://www.ateliux.com.br"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Desenvolvido por Ateliux"
                className="inline-flex flex-col items-center justify-center gap-2 text-center text-xs text-zinc-500 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 md:flex-row md:items-center md:justify-start md:text-left"
              >
                <span className="uppercase tracking-[0.14em]">Desenvolvido por</span>
                <Image
                  src={ateliuxLogoSrc}
                  alt="Ateliux"
                  width={110}
                  height={38}
                  className="h-auto w-[140px] object-contain"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 py-6 text-xs text-zinc-500 md:flex-row">
          <p>{CURRENT_YEAR} Marima. Todos os direitos reservados.</p>
          <p>Marima - Moda Fitness</p>
        </div>
      </Container>
    </footer>
  );
}