import { useGetProjects, useGetPinnedProjects } from "@workspace/api-client-react";
import { ProjectCard } from "@/components/project-card";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useWeb3Auth } from "@/lib/web3";
import { Link } from "wouter";
import { Rocket } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { open } = useWeb3Modal();
  const { isConnected } = useWeb3Auth();
  
  const { data: pinnedData, isLoading: pinnedLoading } = useGetPinnedProjects();
  const { data: projectsData, isLoading: projectsLoading } = useGetProjects({ page: 1, limit: 20 });

  const isEmpty = !pinnedLoading && !projectsLoading && 
                  (!pinnedData || pinnedData.length === 0) && 
                  (!projectsData || projectsData.projects.length === 0);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/50 py-16 px-6 sm:px-12 text-center">
        <div className="absolute inset-0 opacity-40 pointer-events-none" 
             style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-mesh.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight"
          >
            Web3Hub <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              一站式需求发布与匹配
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground"
          >
            连接项目方、KOL与开发者，发现Web3世界的无限可能。
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <Link href="/apply" className="px-8 py-3.5 rounded-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/25">
              立即注册项目
            </Link>
            {!isConnected && (
              <button 
                onClick={() => open()}
                className="px-8 py-3.5 rounded-full font-bold bg-white text-foreground border border-border hover:bg-muted hover:scale-105 transition-all shadow-sm"
              >
                连接钱包
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {isEmpty ? (
        <div className="py-24 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">平台刚刚起航</h3>
          <p className="text-muted-foreground mb-8">
            还没有项目发布需求，抢先成为第一个入驻的 Web3 项目，获得全站曝光！
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/apply" className="pink-btn px-6 py-3 rounded-xl">立即注册项目</Link>
            {!isConnected && (
              <button onClick={() => open()} className="px-6 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80">
                连接钱包
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Pinned Projects */}
          {pinnedData && pinnedData.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">置顶推荐</h2>
                <span className="w-2 h-2 rounded-full bg-[#00FF9F] shadow-[0_0_8px_#00FF9F] animate-pulse" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {pinnedData.map((project) => (
                  <ProjectCard key={project.id} project={project} isPinned />
                ))}
              </div>
            </section>
          )}

          {/* Regular Projects */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">最新项目需求</h2>
              <div className="text-sm text-muted-foreground">共 {projectsData?.total || 0} 个项目</div>
            </div>
            
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {projectsData?.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
