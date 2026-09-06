"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProjectListItem, UserProfileProject } from "@/lib/types";

type CardProject = ProjectListItem | UserProfileProject;

function getBuilder(project: CardProject): { id: string; displayName: string; avatarUrl: string | null } | null {
  if ("user" in project && project.user) {
    return project.user;
  }
  return null;
}

export function ProjectCard({ project }: { project: CardProject }) {
  const builder = getBuilder(project);
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  return (
    <Link
      href={`/${locale}/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {project.screenshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.screenshotUrl}
            alt={`Screenshot of ${project.title}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            No screenshot
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {project.title}
        </h3>

        {builder && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {builder.displayName}
          </p>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-1 pt-2 text-xs text-zinc-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path
              fillRule="evenodd"
              d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{project.viewCount.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}
