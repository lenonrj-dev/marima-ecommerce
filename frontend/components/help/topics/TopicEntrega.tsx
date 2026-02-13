import PolicyArticle from "@/components/policies/PolicyArticle";
import { DELIVERY_POLICY } from "@/lib/institutionalData";

export default function TopicEntrega() {
  return (
    <PolicyArticle
      title={DELIVERY_POLICY.title}
      index={DELIVERY_POLICY.index}
      sections={DELIVERY_POLICY.sections}
    />
  );
}
