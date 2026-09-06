"use client";

import { useEffect, useState, useCallback } from "react";
import type { ProjectListItem } from "@/lib/types";
import { ProjectCard } from "@/components/project-card";
import { SkeletonCard } from "@/components/skeleton-card";

const PAGE_SIZE = 20;

type SortOption = "newest" | "views";

export default function FeedPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchProjects = useCallback(
    async (currentOffset: number, reset: boolean) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(currentOffset));
      if (selectedTag) params.set("tag", selectedTag);
      if (sort === "views") params.set("sort", "views");

      try {
        const res = await fetch(`/api/projects?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load projects");
        const data = await res.json();
        const items: ProjectListItem[] = data.projects ?? [];

        if (reset) {
          setProjects(items);
        } else {
          setProjects((prev) => [...prev, ...items]);
        }
        setHasMore(items.length >= PAGE_SIZE);

        if (reset) {
          const tags = new Set<string>();
          for (const p of items) {
            for (const t of p.tags) {
              tags.add(t);
            }
          }
          setAllTags(Array.from(tags).sort());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [selectedTag, sort],
  );

  useEffect(() => {
    setLoading(true);
    setError(null);
    setOffset(0);
    setHasMore(true);
    fetchProjects(0, true).finally(() => setLoading(false));
  }, [fetchProjects]);

  const loadMore = async () => {
    const nextOffset = offset + PAGE_SIZE;
    setLoadingMore(true);
    await fetchProjects(nextOffset, false);
    setOffset(nextOffset);
    setLoadingMore(false);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? null : tag));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Filter chips */}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTagClick(tag)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
              aria-pressed={selectedTag === tag}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Sort toggle */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm text-zinc-500 dark:text-zinc-400">Sort:</span>
        <div className="inline-flex rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setSort("newest")}
            className={`rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sort === "newest"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            aria-pressed={sort === "newest"}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSort("views")}
            className={`rounded-r-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sort === "views"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
            aria-pressed={sort === "views"}
          >
            Most viewed
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
            No projects yet
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {selectedTag
              ? `No projects found with the tag "${selectedTag}".`
              : "Be the first to share an AI project."}
          </p>
        </div>
      )}

      {/* Projects grid */}
      {!loading && projects.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
