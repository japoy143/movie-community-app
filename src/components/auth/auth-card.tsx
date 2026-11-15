import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  footer: { text: string; linkLabel: string; href: "/sign-in" | "/sign-up" };
  children: ReactNode;
};

/** Shared shell for the sign-in and sign-up forms. */
export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="card stack gap-6 p-6">
      <div className="stack gap-1">
        <h1 className="text-title">{title}</h1>
        <p className="text-meta">{description}</p>
      </div>

      {children}

      <p className="text-meta text-center">
        {footer.text}{" "}
        <Link href={footer.href} className="link">
          {footer.linkLabel}
        </Link>
      </p>
    </div>
  );
}
