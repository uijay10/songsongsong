import { useState, useEffect, useRef, useCallback } from "react";
import { useGetProjects, useGetPinnedProjects } from "@workspace/api-client-react";
import { ProjectCard } from "@/components/project-card";
import { Search, Flame } from "lucide-react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { generateGradient } from "@/lib/utils";

export default function Home() {
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); setAllProjects([]); }, [debouncedSearch]);

  const { data: pinnedData } = useGetPinnedProjects();
  const { data: projectsData, isLoading } = useGetProjects({
    search: debouncedSearch || undefined, page, limit: 30,
  });
  const { data: hotData } = useGetProjects({ page: 1, limit: 10 });

  useEffect(() => {
    if (projectsData?.projects) {
      if (page === 1) setAllProjects(projectsData.projects);
      else setAllProjects((prev) => [...prev, ...projectsData.projects]);
    }
  }, [projectsData, page]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && projectsData && page < projectsData.totalPages) setPage((p) => p + 1);
  }, [projectsData, page]);

  useEffect(() => {
    const obs = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [handleObserver]);

  const hasPinned = pinnedData && pinnedData.length > 0;
  const hasProjects = allProjects.length > 0;
  const hotProjects = hotData?.projects ?? [];

  return (
    <div className="space-y-6 pb-4">
      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-foreground">Web3Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("tagline")}</p>
        </div>
        <Link href="/apply" className="shrink-0 inline-flex items-center gap-1 px-5 py-2 rounded-full text-sm font-bold bg-[#FF69B4] text-white hover:bg-[#ff4fa8] shadow-sm hover:shadow transition-all">
          {t("register")}
        </Link>
      </div>

      {/* ── Encouragement + Search + Join button ────────── */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl px-6 py-5 space-y-4">
        <p className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 leading-snug">
          {t("encouragement")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-11 pr-4 py-2.5 rounded-full border border-border dark:border-slate-700 bg-white dark:bg-slate-800 text-sm placeholder-muted-foreground dark:placeholder-slate-400 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <Link
            href="/apply"
            className="shrink-0 inline-flex items-center justify-center gap-1 px-6 py-2.5 rounded-full font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-300 transition-all"
          >
            🚀 {t("joinNow")}
          </Link>
        </div>
      </div>

      {/* ── Pinned Zone ─────────────────────────────────── */}
      <section className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("pinned")}</h2>
          <span className="w-2 h-2 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F] animate-pulse" />
        </div>

        {hasPinned ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {pinnedData.map((project) => (
              <ProjectCard key={project.id} project={project} isPinned />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted/10 shimmer-cell" />
            ))}
          </div>
        )}
      </section>

      {/* ── Regular Zone + Hot Rank sidebar ─────────────── */}
      <section className="pt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("regular")}</h2>
          {hasProjects && (
            <span className="text-xs text-muted-foreground">{t("total")} {projectsData?.total ?? 0} {t("projects")}</span>
          )}
        </div>

        <div className="flex gap-4 items-start">
          {/* ── Left: 2-col project grid ── */}
          <div className="flex-1 min-w-0">
            {!hasProjects && !isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl border border-dashed border-border/40 bg-muted/10 shimmer-cell" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {isLoading && page === 1
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                    ))
                  : allProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} compact />
                    ))
                }
              </div>
            )}

            <div ref={loaderRef} className="h-4" />
            {isLoading && page > 1 && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* ── Right: Hot Rank sidebar ── */}
          <div className="w-64 shrink-0 hidden lg:block">
            <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-2xl overflow-hidden sticky top-48">
              <div className="flex items-center gap-2 px-4 py-4 border-b border-border/50 dark:border-slate-700 bg-white dark:bg-slate-800">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-black dark:text-slate-100">{t("hotRank")}</span>
              </div>
              <div className="divide-y divide-border/30 dark:divide-slate-700">
                {hotProjects.length === 0
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5 px-4 py-3">
                        <div className="w-5 h-5 rounded-full bg-muted dark:bg-slate-700 animate-pulse shrink-0" />
                        <div className="h-3 bg-muted dark:bg-slate-700 animate-pulse rounded flex-1" />
                      </div>
                    ))
                  : hotProjects.map((project, idx) => (
                      <Link
                        key={project.id}
                        href={`/project/${project.id}`}
                        className="flex items-center gap-2.5 px-4 py-3 hover:bg-muted/50 dark:hover:bg-slate-700/50 transition-colors group"
                      >
                        <span className={`text-xs font-bold w-5 shrink-0 text-center ${idx < 3 ? "text-orange-600 dark:text-orange-400 font-extrabold" : "text-muted-foreground dark:text-slate-400"}`}>
                          {idx + 1}
                        </span>
                        <div
                          className="w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[10px] font-bold text-muted-foreground dark:text-slate-300 border border-border/40 dark:border-slate-600"
                          style={{ background: project.logo ? `url(${project.logo}) center/cover` : generateGradient(project.id?.toString()) }}
                        >
                          {!project.logo && project.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-foreground dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                            {project.name}
                          </p>
                          {project.latestPostTitle && (
                            <p className="text-[10px] text-muted-foreground dark:text-slate-400 truncate">{project.latestPostTitle}</p>
                          )}
                        </div>
                      </Link>
                    ))
                }
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
