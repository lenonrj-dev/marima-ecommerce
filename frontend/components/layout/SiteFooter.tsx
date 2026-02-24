import Image from "next/image";
import Link from "next/link";
import Container from "@/components/ui/Container";
import FooterNewsletterForm from "@/components/layout/FooterNewsletterForm";
import { SITE_COPY } from "@/lib/siteCopy";

const CURRENT_YEAR = 2026;

const logoSrc =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771339219/MARIMA._1_hrjb8k.png";

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
                  className="h-15 w-15 select-none"
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
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 py-6 text-xs text-zinc-500 md:flex-row">
          <p>
            {CURRENT_YEAR} Marima. Todos os direitos reservados.
          </p>
          <p>Marima - Moda Fitness</p>
        </div>
      </Container>
    </footer>
  );
}
