import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import type { Project } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  isPinned?: boolean;
  compact?: boolean;
}

export function ProjectCard({ project, isPinned, compact }: ProjectCardProps) {
  const isNew = new Date(project.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;

  if (compact) {
    return (
      <div className={cn(
        "relative bg-white border border-gray-200 rounded-xl p-4 transition-all duration-200",
        "hover:scale-[1.02] hover:border-gray-400 hover:shadow-md cursor-pointer"
      )}>
        {isNew && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#FF69B4] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
            New
          </span>
        )}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-muted border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
            {project.logo ? (
              <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">{project.name.charAt(0)}</span>
            )}
          </div>
          <span className="font-bold text-sm text-foreground truncate">{project.name}</span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[32px]">
          {project.latestPostTitle || project.tagline || "暂无动态"}
        </p>

        <Link
          href={`/project/${project.id}`}
          className="block text-center w-full py-1.5 rounded-lg bg-[#FF69B4] text-white text-xs font-semibold hover:bg-[#ff4fa8] transition-colors"
        >
          查看
        </Link>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative bg-white border rounded-xl p-5 transition-all duration-200",
      "hover:scale-[1.02] hover:border-gray-400 hover:shadow-lg",
      isPinned ? "border-gray-300 shadow-sm" : "border-gray-200 shadow-sm"
    )}>
      {isNew && (
        <span className="absolute -top-2 -right-2 bg-[#FF69B4] text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
          New
        </span>
      )}

      {isPinned && project.pinnedUntil && (
        <div className="absolute top-3 right-3">
          <span className="text-[11px] font-mono font-semibold text-[#00FF9F] bg-black/80 px-2 py-0.5 rounded border border-[#00FF9F]/30"
            style={{ textShadow: "0 0 6px #00FF9F" }}>
            ⏱ {formatDistanceToNow(new Date(project.pinnedUntil))}
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-muted border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
          {project.logo ? (
            <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-muted-foreground">{project.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="font-bold text-base text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {project.tagline || "No description provided."}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {project.latestPostTitle ? (
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground">{project.latestPostTitle}</span>
            </p>
          ) : (
            <span className="text-xs text-muted-foreground italic">暂无动态</span>
          )}
        </div>
        <Link
          href={`/project/${project.id}`}
          className="shrink-0 px-4 py-1.5 rounded-full bg-[#FF69B4] text-white text-xs font-semibold hover:bg-[#ff4fa8] transition-colors"
        >
          查看
        </Link>
      </div>
    </div>
  );
}
