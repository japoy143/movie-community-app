import Image from "next/image";
import { tmdbImage, type CastMember } from "@/lib/tmdb";

export function CastList({ movieId, cast }: { movieId: number; cast: CastMember[] }) {
  const top = [...cast].sort((a, b) => a.order - b.order).slice(0, 12);
  if (top.length === 0) return null;

  return (
    <section aria-labelledby={`cast-heading-${movieId}`} className="stack gap-3">
      <h2 id={`cast-heading-${movieId}`} className="text-headline">
        Top cast
      </h2>
      <ul className="scroll-row">
        {top.map((person) => {
          const photo = tmdbImage(person.profile_path, "w185");
          return (
            <li key={person.id} className="flex w-24 flex-col gap-1.5">
              <div className="avatar relative size-24 overflow-hidden">
                {photo ? (
                  <Image src={photo} alt="" fill sizes="96px" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-xl font-semibold text-fg-muted">
                    {person.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="line-clamp-2 text-sm font-semibold">{person.name}</p>
                <p className="line-clamp-2 text-xs text-fg-muted">{person.character}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
