"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, cn } from "../../dashboard/ui";
import CashbackRules from "./CashbackRules";
import CouponModal from "./CouponModal";
import CouponsTable from "./CouponsTable";
import { apiFetch, type ApiListResponse, HttpError } from "../../../lib/api";
import type { CashbackRule, Coupon } from "../../../lib/types";

export default function MarketingPage() {
  const [tab, setTab] = useState<"cupons" | "cashback">("cupons");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [rules, setRules] = useState<CashbackRule[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [couponRes, ruleRes] = await Promise.all([
        apiFetch<ApiListResponse<Coupon>>("/api/v1/admin/coupons", { query: { limit: 200 } }),
        apiFetch<ApiListResponse<CashbackRule>>("/api/v1/admin/cashback/rules", { query: { limit: 200 } }),
      ]);

      setCoupons(couponRes.data || []);
      setRules(ruleRes.data || []);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível carregar dados de marketing.");
      } else {
        setError("Não foi possível carregar dados de marketing.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onCreateCoupon(coupon: Coupon) {
    setError(null);

    try {
      const payload = {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        amount: coupon.amount,
        minSubtotal: coupon.minSubtotal,
        maxUses: coupon.maxUses,
        startsAt: coupon.startsAt,
        endsAt: coupon.endsAt,
        active: coupon.active,
      };

      const response = await apiFetch<{ data: Coupon }>("/api/v1/admin/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCoupons((previous) => [response.data, ...previous]);
      setOpenNew(false);
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível criar o cupom.");
      } else {
        setError("Não foi possível criar o cupom.");
      }
    }
  }

  async function onToggleCoupon(id: string) {
    setError(null);

    try {
      const response = await apiFetch<{ data: Coupon }>(`/api/v1/admin/coupons/${id}/toggle`, {
        method: "PATCH",
      });

      setCoupons((previous) => previous.map((coupon) => (coupon.id === id ? response.data : coupon)));
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível atualizar o cupom.");
      } else {
        setError("Não foi possível atualizar o cupom.");
      }
    }
  }

  async function onToggleRule(id: string) {
    setError(null);

    try {
      const response = await apiFetch<{ data: CashbackRule }>(`/api/v1/admin/cashback/rules/${id}/toggle`, {
        method: "PATCH",
      });

      setRules((previous) => previous.map((rule) => (rule.id === id ? response.data : rule)));
    } catch (err) {
      if (err instanceof HttpError) {
        setError(err.message || "Não foi possível atualizar a regra de cashback.");
      } else {
        setError("Não foi possível atualizar a regra de cashback.");
      }
    }
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Marketing</h1>
          <p className="mt-1 text-sm text-slate-500">Cupons, cashback e campanhas para aumento de conversão.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => loadData()}>Atualizar</Button>
          <Button variant="primary" onClick={() => setOpenNew(true)}>Novo cupom</Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <Card>
        <CardHeader
          title="Gestão de incentivos"
          subtitle="Controle de promoções e regras de fidelização."
          right={<Badge tone="neutral">Backend</Badge>}
        />
        <CardBody>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("cupons")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-semibold transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                tab === "cupons"
                  ? "bg-violet-100 text-violet-700"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              Cupons
            </button>
            <button
              type="button"
              onClick={() => setTab("cashback")}
              className={cn(
                "rounded-xl px-3 py-2 text-xs font-semibold transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300",
                tab === "cashback"
                  ? "bg-violet-100 text-violet-700"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              Cashback
            </button>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="grid gap-3">
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              </div>
            ) : tab === "cupons" ? (
              <CouponsTable coupons={coupons} onToggle={onToggleCoupon} />
            ) : (
              <CashbackRules rules={rules} onToggle={onToggleRule} />
            )}
          </div>
        </CardBody>
      </Card>

      <CouponModal open={openNew} onClose={() => setOpenNew(false)} onCreate={onCreateCoupon} />
    </div>
  );
}
