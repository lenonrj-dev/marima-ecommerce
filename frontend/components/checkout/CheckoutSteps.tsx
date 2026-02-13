import { CHECKOUT_COPY } from "@/lib/checkoutData";

export default function CheckoutSteps({
  active = "shipping",
}: {
  active?: "shipping" | "payment" | "summary";
}) {
  const steps = [
    { key: "shipping" as const, label: CHECKOUT_COPY.steps.shipping },
    { key: "payment" as const, label: CHECKOUT_COPY.steps.payment },
    { key: "summary" as const, label: CHECKOUT_COPY.steps.summary },
  ];

  return (
    <div className="flex flex-wrap items-center gap-6 border-b border-zinc-200 pb-3">
      {steps.map((s) => {
        const isActive = s.key === active;
        const isDone =
          (active === "payment" && s.key === "shipping") ||
          (active === "summary" && (s.key === "shipping" || s.key === "payment"));

        return (
          <div
            key={s.key}
            className="inline-flex items-center gap-2 text-sm font-semibold"
            aria-current={isActive ? "step" : undefined}
          >
            <span
              className={
                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ring-1 " +
                (isActive
                  ? "bg-zinc-900 text-white ring-zinc-900"
                  : isDone
                    ? "bg-zinc-100 text-zinc-900 ring-zinc-200"
                    : "bg-white text-zinc-500 ring-zinc-200")
              }
              aria-hidden
            >
              {s.key === "shipping" ? "1" : s.key === "payment" ? "2" : "3"}
            </span>

            <span className={isActive ? "text-zinc-900" : "text-zinc-600"}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
