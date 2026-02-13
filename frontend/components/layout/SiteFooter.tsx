import Link from "next/link";
import Container from "@/components/ui/Container";
import { SITE_COPY } from "@/lib/siteCopy";

const CURRENT_YEAR = 2026;

export default function SiteFooter() {
  return (
    <footer className="bg-white">
      <Container>
        <div className="grid gap-10 border-t border-zinc-100 py-12 md:grid-cols-4">
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              {SITE_COPY.brand.toLowerCase()}
              <span className="text-zinc-900">.</span>
            </p>
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
            <p className="mt-3 text-sm text-zinc-500">
              Receba lançamentos e ofertas em primeira mão.
            </p>
            <form className="mt-4 flex gap-2">
              <input
                className="h-10 w-full rounded-full border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-400"
                placeholder="Seu e-mail"
                aria-label="Seu e-mail"
              />
              <button
                type="button"
                disabled
                aria-disabled
                title="Cadastro de newsletter em breve"
                className="h-10 shrink-0 cursor-not-allowed rounded-full bg-zinc-300 px-5 text-sm font-medium text-zinc-600"
              >
                Em breve
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 py-6 text-xs text-zinc-500 md:flex-row">
          <p> {CURRENT_YEAR} Marima. Todos os direitos reservados.</p>
          <p>Marima - Moda Fitness</p>
        </div>
      </Container>
    </footer>
  );
}
