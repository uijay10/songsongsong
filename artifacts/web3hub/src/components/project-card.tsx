import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import type { Project } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  isPinned?: boolean;
}

export function ProjectCard({ project, isPinned }: ProjectCardProps) {
  const isNew = new Date(project.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;

  return (
    <div className={cn(
      "relative bg-card rounded-2xl p-5 border transition-all duration-300",
      "hover:-translate-y-1 hover:shadow-xl hover:border-gray-300",
      isPinned ? "border-primary/30 shadow-md bg-gradient-to-b from-white to-primary/5" : "border-border shadow-sm"
    )}>
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-[#FF69B4] text-white text-[10px] font-bold px-2 py-1 rounded-full animate-fade-out shadow-sm">
          NEW
        </div>
      )}
      
      {isPinned && project.pinnedUntil && (
        <div className="absolute top-4 right-4">
          <div className="text-xs font-mono font-medium text-neon bg-black/80 px-2 py-1 rounded-md border border-[#00FF9F]/30 backdrop-blur-sm">
            Top: {formatDistanceToNow(new Date(project.pinnedUntil))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
          {project.logo ? (
            <img src={project.logo} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-bold text-muted-foreground">{project.name.charAt(0)}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-foreground truncate pr-16">{project.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[40px]">
            {project.tagline || "No description provided."}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          {project.latestPostTitle ? (
            <div className="text-xs">
              <span className="text-muted-foreground">最新: </span>
              <span className="font-medium text-foreground truncate block">{project.latestPostTitle}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">暂无动态</span>
          )}
        </div>
        <Link 
          href={`/project/${project.id}`}
          className="shrink-0 pink-btn px-4 py-1.5 rounded-full text-xs"
        >
          查看
        </Link>
      </div>
    </div>
  );
}
