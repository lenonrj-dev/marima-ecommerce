import { Star } from "lucide-react";

export default function RatingStars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <div className="flex items-center gap-1 text-zinc-900/80">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5" fill={i < full ? "currentColor" : "transparent"} />
      ))}
    </div>
  );
}
