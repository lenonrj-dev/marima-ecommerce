import SuccessClient from "./SuccessClient";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : "";
}

export default function CheckoutSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const paymentId =
    readParam(searchParams, "payment_id") || readParam(searchParams, "collection_id") || readParam(searchParams, "id");

  const status = readParam(searchParams, "status") || undefined;
  const externalReference = readParam(searchParams, "external_reference") || undefined;
  const merchantOrderId = readParam(searchParams, "merchant_order_id") || undefined;

  return (
    <SuccessClient
      paymentId={paymentId}
      status={status}
      externalReference={externalReference}
      merchantOrderId={merchantOrderId}
    />
  );
}

