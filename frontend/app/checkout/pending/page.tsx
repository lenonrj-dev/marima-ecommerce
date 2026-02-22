import PendingClient from "./PendingClient";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
}

export default function CheckoutPendingPage({ searchParams }: { searchParams: SearchParams }) {
  const paymentId =
    readParam(searchParams, "payment_id") || readParam(searchParams, "collection_id") || readParam(searchParams, "id");

  const orderId =
    readParam(searchParams, "orderId") ||
    readParam(searchParams, "order_id") ||
    readParam(searchParams, "external_reference") ||
    undefined;
  const totalPaid =
    readParam(searchParams, "total") ||
    readParam(searchParams, "amount") ||
    readParam(searchParams, "transaction_amount") ||
    undefined;
  const externalReference = readParam(searchParams, "external_reference") || undefined;
  const merchantOrderId = readParam(searchParams, "merchant_order_id") || undefined;

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
