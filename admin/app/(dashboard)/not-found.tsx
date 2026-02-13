import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[68vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Página não encontrada</span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">Esta rota não existe no painel</h1>
        <p className="mt-2 text-sm text-slate-600">Verifique o endereço ou volte para a visão geral para continuar a operação do e-commerce.</p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-b from-[#8B5CF6] to-[#7D48D3] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(125,72,211,0.28)] transition hover:from-[#7D48D3] hover:to-[#6C39C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
