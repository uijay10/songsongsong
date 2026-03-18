import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWeb3Auth } from "@/lib/web3";
import { useApplySpace } from "@workspace/api-client-react";
import { ApplySpaceRequestType } from "@workspace/api-client-react";
import { Building2, Code2, Megaphone, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

const schema = z.object({
  type: z.nativeEnum(ApplySpaceRequestType),
  twitter: z.string().min(1, "Required").optional().or(z.literal("")),
  tweetLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  projectName: z.string().optional().or(z.literal("")),
  projectTwitter: z.string().optional().or(z.literal("")),
  docsLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  github: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedin: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export default function ApplySpace() {
  const { address, isConnected } = useWeb3Auth();
  const applyMutation = useApplySpace();
  const [success, setSuccess] = useState(false);
  const [_, setLocation] = useLocation();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: ApplySpaceRequestType.project
    }
  });

  const selectedType = watch("type");

  const onSubmit = (data: FormValues) => {
    if (!address) return alert("请先连接钱包");
    
    applyMutation.mutate({
      data: {
        wallet: address,
        ...data
      }
    }, {
      onSuccess: () => {
        setSuccess(true);
        setTimeout(() => setLocation("/"), 3000);
      }
    });
  };

  if (!isConnected) {
    return (
      <div className="py-32 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">请先连接钱包</h2>
        <p className="text-muted-foreground mb-8">申请创建空间需要验证您的钱包地址。</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="py-32 text-center max-w-md mx-auto animate-in zoom-in">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">申请提交成功！</h2>
        <p className="text-muted-foreground mb-8">
          我们正在审核您的申请，审核通过后将为您开通专属空间。即将返回首页...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-4">申请创建专属空间</h1>
        <p className="text-muted-foreground">选择您的身份，入驻 Web3Hub 获取专属展示位与发帖权限。</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-card p-8 rounded-3xl border border-border shadow-sm">
        
        {/* Type Selection */}
        <div className="space-y-4">
          <label className="text-sm font-semibold text-foreground">身份类型</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${selectedType === ApplySpaceRequestType.project ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
              <input type="radio" value={ApplySpaceRequestType.project} {...register("type")} className="sr-only" />
              <Building2 className={`w-8 h-8 ${selectedType === ApplySpaceRequestType.project ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-bold">项目方</span>
            </label>
            <label className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${selectedType === ApplySpaceRequestType.kol ? 'border-amber-500 bg-amber-500/5' : 'border-border hover:border-amber-500/50'}`}>
              <input type="radio" value={ApplySpaceRequestType.kol} {...register("type")} className="sr-only" />
              <Megaphone className={`w-8 h-8 ${selectedType === ApplySpaceRequestType.kol ? 'text-amber-500' : 'text-muted-foreground'}`} />
              <span className="font-bold">KOL</span>
            </label>
            <label className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${selectedType === ApplySpaceRequestType.developer ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-green-500/50'}`}>
              <input type="radio" value={ApplySpaceRequestType.developer} {...register("type")} className="sr-only" />
              <Code2 className={`w-8 h-8 ${selectedType === ApplySpaceRequestType.developer ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="font-bold">开发者</span>
            </label>
          </div>
        </div>

        <div className="space-y-6 pt-6 border-t border-border">
          {/* Dynamic Fields based on Type */}
          {selectedType === ApplySpaceRequestType.project && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">项目名称 *</label>
                <input {...register("projectName")} className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="例如: Web3Hub" />
                {errors.projectName && <p className="text-destructive text-xs mt-1">{errors.projectName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">项目推特 *</label>
                <input {...register("projectTwitter")} className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="@YourProject" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">文档链接 / 白皮书</label>
                <input {...register("docsLink")} className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="https://..." />
                {errors.docsLink && <p className="text-destructive text-xs mt-1">{errors.docsLink.message}</p>}
              </div>
            </>
          )}

          {selectedType === ApplySpaceRequestType.kol && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">个人推特 *</label>
                <input {...register("twitter")} className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="@YourTwitter" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">代表推文链接 *</label>
                <p className="text-xs text-muted-foreground mb-2">请提供一条数据表现较好的推文链接以供审核</p>
                <input {...register("tweetLink")} className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="https://twitter.com/..." />
                {errors.tweetLink && <p className="text-destructive text-xs mt-1">{errors.tweetLink.message}</p>}
              </div>
            </>
          )}

          {selectedType === ApplySpaceRequestType.developer && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">GitHub 主页 *</label>
                <input {...register("github")} className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="https://github.com/..." />
                {errors.github && <p className="text-destructive text-xs mt-1">{errors.github.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">LinkedIn 主页 (可选)</label>
                <input {...register("linkedin")} className="w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="https://linkedin.com/in/..." />
                {errors.linkedin && <p className="text-destructive text-xs mt-1">{errors.linkedin.message}</p>}
              </div>
            </>
          )}
        </div>

        <button 
          type="submit" 
          disabled={applyMutation.isPending}
          className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {applyMutation.isPending ? "提交中..." : "提交申请"}
        </button>
      </form>
    </div>
  );
}
