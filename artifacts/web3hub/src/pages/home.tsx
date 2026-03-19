import { useState, useEffect, useRef, useCallback } from "react";
import { useGetProjects, useGetPinnedProjects } from "@workspace/api-client-react";
import { ProjectCard } from "@/components/project-card";
import { Search, Pin } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset when search changes
  useEffect(() => {
    setPage(1);
    setAllProjects([]);
  }, [debouncedSearch]);

  const { data: pinnedData } = useGetPinnedProjects();
  const { data: projectsData, isLoading } = useGetProjects({
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  // Accumulate pages
  useEffect(() => {
    if (projectsData?.projects) {
      if (page === 1) {
        setAllProjects(projectsData.projects);
      } else {
        setAllProjects((prev) => [...prev, ...projectsData.projects]);
      }
    }
  }, [projectsData, page]);

  // Infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && projectsData && page < projectsData.totalPages) {
      setPage((p) => p + 1);
    }
  }, [projectsData, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const isEmpty = !isLoading && (!pinnedData || pinnedData.length === 0) && allProjects.length === 0;

  return (
    <div className="space-y-10 pb-12">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="pt-4 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">
              Web3Hub
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Web3 项目方一站式需求发布与匹配平台
            </p>
          </div>
          <Link
            href="/apply"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm bg-[#FF69B4] text-white hover:bg-[#ff4fa8] shadow-sm hover:shadow-md transition-all"
          >
            + 注册项目
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, keyword..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full border border-border bg-muted/40 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* ── Empty State ──────────────────────────────────── */}
      {isEmpty ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold text-foreground mb-2">目前还没有项目团队入驻</p>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            成为 Web3Hub 首批项目方，立即发布需求，让全网开发者与投资者第一时间看到你！
          </p>

          {/* Placeholder grid frames for pinned */}
          <div className="mt-10 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Pin className="w-4 h-4 text-muted-foreground/50" />
                <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest">付费置顶专区</span>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl border border-dashed border-border/40 bg-muted/10" />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4 justify-center">
                <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest">普通项目区</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl border border-dashed border-border/40 bg-muted/10" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Pinned Projects ────────────────────────────── */}
          {pinnedData && pinnedData.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-[#00FF9F]" />
                <h2 className="text-base font-bold uppercase tracking-wide text-muted-foreground">付费置顶专区</h2>
                <span className="w-2 h-2 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F] animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pinnedData.map((project) => (
                  <ProjectCard key={project.id} project={project} isPinned />
                ))}
              </div>
            </section>
          )}

          {/* ── Regular Projects ───────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold uppercase tracking-wide text-muted-foreground">
                普通项目区
              </h2>
              <span className="text-xs text-muted-foreground">共 {projectsData?.total ?? 0} 个项目</span>
            </div>

            {isLoading && page === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {allProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} compact />
                ))}
              </div>
            )}

            {/* Infinite scroll trigger */}
            <div ref={loaderRef} className="h-4" />
            {isLoading && page > 1 && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
