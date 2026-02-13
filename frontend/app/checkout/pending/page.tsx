import PendingClient from "./PendingClient";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
}

export default function CheckoutPendingPage({ searchParams }: { searchParams: SearchParams }) {
  const paymentId =
    readParam(searchParams, "payment_id") || readParam(searchParams, "collection_id") || readParam(searchParams, "id");

  const externalReference = readParam(searchParams, "external_reference") || undefined;
  const merchantOrderId = readParam(searchParams, "merchant_order_id") || undefined;

  return (
    <PendingClient paymentId={paymentId} externalReference={externalReference} merchantOrderId={merchantOrderId} />
  );
}

