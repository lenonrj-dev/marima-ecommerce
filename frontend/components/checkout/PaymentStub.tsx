"use client";

type PaymentStubProps = {
  state: "idle" | "loading" | "success" | "error";
  message: string | null;
};

export default function PaymentStub({ state, message }: PaymentStubProps) {
  if (state === "idle" && !message) return null;

  const tone =
    state === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : state === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <div className={`rounded-2xl border p-4 text-sm ${tone}`} role="status" aria-live="polite">
      {message ?? "Processando finalização da compra..."}
    </div>
  );
}
