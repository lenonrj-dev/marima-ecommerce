import PendingClient from "./PendingClient";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
}

export default async function CheckoutPendingPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const paymentId =
    readParam(resolvedSearchParams, "payment_id") ||
    readParam(resolvedSearchParams, "collection_id") ||
    readParam(resolvedSearchParams, "id");

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
  const externalReference = readParam(resolvedSearchParams, "external_reference") || undefined;
  const merchantOrderId = readParam(resolvedSearchParams, "merchant_order_id") || undefined;

  return (
    <PendingClient
      paymentId={paymentId}
      externalReference={externalReference}
      merchantOrderId={merchantOrderId}
      orderId={orderId}
      totalPaid={totalPaid}
    />
  );
}
