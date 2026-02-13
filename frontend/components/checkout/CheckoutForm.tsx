"use client";

import type { CheckoutFormValues } from "@/lib/checkoutData";

type CheckoutFormProps = {
  values: CheckoutFormValues;
  onChange: (field: keyof CheckoutFormValues, value: string) => void;
};

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
        {label}
        {required ? <span className="text-zinc-400"> *</span> : null}
      </span>
      <input
        value={value}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-black/20"
        required={required}
      />
    </label>
  );
}

export default function CheckoutForm({ values, onChange }: CheckoutFormProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">Dados de entrega</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome"
          required
          value={values.firstName}
          onChange={(value) => onChange("firstName", value)}
          placeholder="Seu nome"
          autoComplete="given-name"
        />
        <Field
          label="Sobrenome"
          required
          value={values.lastName}
          onChange={(value) => onChange("lastName", value)}
          placeholder="Seu sobrenome"
          autoComplete="family-name"
        />
        <Field
          label="E-mail"
          required
          value={values.email}
          onChange={(value) => onChange("email", value)}
          type="email"
          placeholder="seuemail@dominio.com"
          autoComplete="email"
        />
        <Field
          label="Telefone"
          required
          value={values.phone}
          onChange={(value) => onChange("phone", value)}
          placeholder="(00) 00000-0000"
          autoComplete="tel"
        />
        <Field
          label="CEP"
          required
          value={values.zip}
          onChange={(value) => onChange("zip", value)}
          placeholder="00000-000"
          autoComplete="postal-code"
        />
        <Field
          label="Estado"
          required
          value={values.state}
          onChange={(value) => onChange("state", value)}
          placeholder="UF"
          autoComplete="address-level1"
        />
        <Field
          label="Cidade"
          required
          value={values.city}
          onChange={(value) => onChange("city", value)}
          placeholder="Cidade"
          autoComplete="address-level2"
        />
        <Field
          label="Bairro"
          required
          value={values.neighborhood}
          onChange={(value) => onChange("neighborhood", value)}
          placeholder="Bairro"
          autoComplete="address-level3"
        />
        <div className="sm:col-span-2">
          <Field
            label="Rua"
            required
            value={values.street}
            onChange={(value) => onChange("street", value)}
            placeholder="Rua"
            autoComplete="address-line1"
          />
        </div>
        <Field
          label="Número"
          required
          value={values.number}
          onChange={(value) => onChange("number", value)}
          placeholder="Número"
          autoComplete="address-line2"
        />
        <Field
          label="Complemento"
          value={values.complement}
          onChange={(value) => onChange("complement", value)}
          placeholder="Apartamento, bloco, referência"
        />
      </div>
    </section>
  );
}
