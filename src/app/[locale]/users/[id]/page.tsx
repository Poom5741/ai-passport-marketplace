import Link from "next/link";
import { notFound } from "next/navigation";
import type { UserProfileResponse } from "@/lib/types";
import { ProjectCard } from "@/components/project-card";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(value: string | number): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;

  let data: UserProfileResponse;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/users/${id}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      if (res.status === 404) notFound();
      throw new Error("Failed to load profile");
    }
    data = await res.json();
  } catch {
    notFound();
  }

  const { user, projects } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href={`/${locale}`}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        &larr; All projects
      </Link>

      {/* Profile header */}
      <div className="flex items-start gap-4 sm:gap-6">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={`${user.displayName}'s avatar`}
            className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-xl font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 sm:h-20 sm:w-20 sm:text-2xl">
            {getInitials(user.displayName)}
          </span>
        )}

        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {user.displayName}
          </h1>
          {user.bio && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {user.bio}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Joined {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      {/* Projects section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Projects
        </h2>

        {projects.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-12 dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No projects yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
