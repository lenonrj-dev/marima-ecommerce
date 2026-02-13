import PolicyArticle from "@/components/policies/PolicyArticle";
import { PRIVACY_POLICY } from "@/lib/institutionalData";

export default function TopicPrivacidade() {
  return (
    <PolicyArticle
      title={PRIVACY_POLICY.title}
      index={PRIVACY_POLICY.index}
      sections={PRIVACY_POLICY.sections}
    />
  );
}
