"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Calendar, Tag, Share2, Heart, Award } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ImageComparison from "@/components/home/ImageComparison";
import { useToast } from "@/components/ui/toast-provider";
import { API_BASE_URL, PLACEHOLDERS, resolveAssetUrl } from "@/lib/constants";

interface ApiMemoryDetail {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  ai_polished_story: string;
  original_image_path: string;
  restored_image_path: string;
  author?: string;
  tags?: string;
  created_at: string;
}

interface DisplayMemory {
  title: string;
  category: string;
  location: string;
  date: string;
  content: string;
  tags: string[];
  beforeImage: string;
  afterImage: string;
  author: string;
  aiMethod: string;
}

function mapApiMemoryToDisplay(data: ApiMemoryDetail): DisplayMemory {
  return {
    title: data.title,
    category: data.category,
    location: data.location,
    date: new Date(data.created_at).toLocaleDateString(),
    content: data.ai_polished_story || data.description,
    tags: data.tags ? data.tags.split(",") : ["乡村记忆", "AI修复"],
    beforeImage: data.original_image_path ? resolveAssetUrl(data.original_image_path) : PLACEHOLDERS.OLD_PHOTO,
    afterImage: data.restored_image_path ? resolveAssetUrl(data.restored_image_path) : PLACEHOLDERS.AI_RESTORED,
    author: data.author || "记忆守护者",
    aiMethod: "Stable Diffusion XL + DeepSeek-V3"
  };
}

export default function MemoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useToast();
  const [memory, setMemory] = useState<DisplayMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/memories/${id}`);
        if (response.ok) {
          const data: ApiMemoryDetail = await response.json();
          setMemory(mapApiMemoryToDisplay(data));
        } else {
          toast.warning({ title: "未找到该记忆", description: "这条内容可能已被删除或尚未发布。" });
          setMemory(null);
        }
      } catch {
        toast.error({ title: "记忆详情加载失败", description: "请稍后重试或检查后端服务状态。" });
        setMemory(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void fetchMemory();
    }
  }, [id, toast]);

  const handleShare = async () => {
    const shareText = memory ? `${memory.title} | ${memory.location}` : "乡村文化记忆";
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl,
        });
        toast.info({ title: "分享成功", description: "系统分享面板已调用完成。" });
        return;
      } catch {
        toast.warning({ title: "分享已取消", description: "你可以稍后再次尝试。" });
        return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard && shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.info({ title: "链接已复制", description: "可以直接发送给其他人查看。" });
        return;
      } catch {
        toast.warning({ title: "当前环境不支持自动复制", description: "请手动复制浏览器地址栏链接。" });
        return;
      }
    }

    toast.warning({ title: "当前环境不支持分享", description: "请手动复制浏览器地址栏链接。" });
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
    </div>
  );
  
  if (!memory) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-xl font-bold">未找到该记忆</p>
      <button onClick={() => router.push('/memories')} className="px-6 py-2 bg-stone-900 text-white rounded-lg">返回列表</button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      <Header />
      
      <main className="flex-grow pt-24 pb-20">
        {/* Navigation Bar */}
        <div className="container mx-auto px-6 py-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>返回记忆长廊</span>
          </button>
        </div>

        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left: Main Content */}
            <div className="lg:col-span-2 space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded text-sm font-medium">
                    {memory.category}
                  </span>
                  <div className="flex items-center gap-1 text-stone-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    {memory.location}
                  </div>
                  <div className="flex items-center gap-1 text-stone-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {memory.date}
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-stone-900 dark:text-stone-50 mb-8 leading-tight">
                  {memory.title}
                </h1>

                {/* Image Comparison Component */}
                <div className="mb-10">
                  <ImageComparison 
                    beforeImage={memory.beforeImage} 
                    afterImage={memory.afterImage} 
                  />
                  <p className="mt-4 text-center text-sm text-stone-400 italic">
                    拖动左滑查看 AI 修复后的惊艳效果
                  </p>
                </div>

                <div className="prose prose-stone dark:prose-invert max-w-none">
                  <div className="text-xl text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                    {memory.content}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-10">
                  {memory.tags.map((tag: string) => (
                    <span 
                      key={tag} 
                      className="flex items-center gap-1 px-4 py-2 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-full text-stone-500 dark:text-stone-400 text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right: Sidebar Sidebar */}
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-100 dark:border-stone-800 shadow-sm sticky top-32"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">提供者</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-500">
                        {memory.author[0]}
                      </div>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{memory.author}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">生成技术</h3>
                    <div className="p-3 bg-stone-50 dark:bg-stone-950 rounded-lg flex items-center gap-3 border border-stone-100 dark:border-stone-800">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="text-sm font-mono text-stone-600 dark:text-stone-300">{memory.aiMethod}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={() => {
                        const nextLiked = !liked;
                        setLiked(nextLiked);
                        toast.info({ title: nextLiked ? "已加入喜欢" : "已取消喜欢", description: nextLiked ? "这条记忆已加入当前会话偏好。" : "这条记忆已从当前会话偏好移除。" });
                      }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        liked 
                          ? "bg-red-50 border-red-200 text-red-500" 
                          : "bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50"
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${liked ? "fill-current" : ""}`} />
                      <span className="text-xs font-semibold">{liked ? "已收藏" : "喜欢"}</span>
                    </button>
                    <button onClick={() => void handleShare()} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 transition-all">
                      <Share2 className="w-6 h-6" />
                      <span className="text-xs font-semibold">分享</span>
                    </button>
                  </div>

                  <button className="w-full py-4 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 rounded-xl font-bold shadow-lg shadow-stone-200 dark:shadow-none hover:-translate-y-1 transition-all">
                    了解更多背景
                  </button>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
