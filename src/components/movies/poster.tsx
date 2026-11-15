import Image from "next/image";
import { tmdbImage } from "@/lib/tmdb";

type Props = {
  path: string | null;
  title: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function Poster({ path, title, sizes, priority, className = "" }: Props) {
  const src = tmdbImage(path, "w500");
  return (
    <div className={`media poster relative ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={`${title} poster`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-3 text-center text-sm text-fg-muted">
          {title}
        </div>
      )}
    </div>
  );
}
