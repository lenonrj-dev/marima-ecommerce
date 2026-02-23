import SuccessClient from "./SuccessClient";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const paymentId =
    readParam(resolvedSearchParams, "payment_id") ||
    readParam(resolvedSearchParams, "collection_id") ||
    readParam(resolvedSearchParams, "id");

  const status = readParam(resolvedSearchParams, "status") || undefined;
  const orderId =
    readParam(resolvedSearchParams, "orderId") ||
    readParam(resolvedSearchParams, "order_id") ||
    readParam(resolvedSearchParams, "external_reference") ||
    undefined;
  const totalPaid =
    readParam(resolvedSearchParams, "total") ||
    readParam(resolvedSearchParams, "amount") ||
    readParam(resolvedSearchParams, "transaction_amount") ||
    undefined;
  const paidAt =
    readParam(resolvedSearchParams, "paid_at") ||
    readParam(resolvedSearchParams, "date_approved") ||
    readParam(resolvedSearchParams, "approved_at") ||
    undefined;
  const externalReference = readParam(resolvedSearchParams, "external_reference") || undefined;
  const merchantOrderId = readParam(resolvedSearchParams, "merchant_order_id") || undefined;

  return (
    <SuccessClient
      paymentId={paymentId}
      status={status}
      externalReference={externalReference}
      merchantOrderId={merchantOrderId}
      orderId={orderId}
      totalPaid={totalPaid}
      paidAt={paidAt}
    />
  );
}
