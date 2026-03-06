import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/ui/Container";

function normalizeTitle(value: string) {
  return value.trim().toLowerCase();
}

function buildCategoryHref(title: string) {
  const normalized = normalizeTitle(title);
  const params = new URLSearchParams();

  switch (normalized) {
    case "fitness":
      params.set("category", "Fitness");
      break;
    case "casual":
      params.set("category", "Casual");
      break;
    case "mais vendidos":
      params.set("category", "Mais Vendidos");
      params.set("sort", "rating_desc");
      break;
    case "novidades":
      params.set("category", "Novidades");
      params.set("sort", "newest");
      break;
    default:
      params.set("category", title);
      break;
  }

  return `/produtos?${params.toString()}`;
}

const categoryImageFitness =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771272256/IMG_8959_japjux.png";

  const categoryImageCasual =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771276544/Tendencias_f3mrfz.png";

  const categoryImageBestSeller =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1771279097/GAB08736_diztda.png";

  const categoryImageNew =
  "https://res.cloudinary.com/dhcaw7ipf/image/upload/v1772811749/IMG_3733_1_caej9n.jpg";

const showcaseCategories = [
  { id: "fitness", title: "Fitness", image: categoryImageFitness },
  { id: "casual", title: "Casual", image: categoryImageCasual },
  { id: "mais-vendidos", title: "Mais Vendidos", image: categoryImageBestSeller },
  { id: "novidades", title: "Novidades", image: categoryImageNew },
];

export default function TopCategories() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Categorias mais desejadas
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-4">
          {showcaseCategories.map((category) => (
            <Link
              key={category.id}
              href={buildCategoryHref(category.title)}
              aria-label={`Ver produtos de ${category.title}`}
              className="group relative block overflow-hidden rounded-[24px] bg-zinc-100"
            >
              <div className="relative h-[320px] w-full sm:h-[420px] lg:h-[460px]">
                <img
                  src={category.image}
                  alt={category.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-4 flex justify-center px-3 sm:bottom-5">
                <div className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 shadow-lg sm:min-w-[160px] sm:text-base">
                  <span>{category.title}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}