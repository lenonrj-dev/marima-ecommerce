import BlogEditorPage from "../../../../components/pages/blog/BlogEditorPage";

export const metadata = {
  title: "Novo post",
};

export default function Page() {
  return <BlogEditorPage mode="create" />;
}
