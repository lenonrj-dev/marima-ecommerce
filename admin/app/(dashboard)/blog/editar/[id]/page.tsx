import BlogEditorPage from "../../../../../components/pages/blog/BlogEditorPage";

type Params = Promise<{ id: string }>;

export const metadata = {
  title: "Editar post",
};

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  return <BlogEditorPage mode="edit" postId={id} />;
}
