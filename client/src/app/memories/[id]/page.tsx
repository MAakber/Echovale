"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MapPin, Calendar, Tag, Share2, Heart, Award } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ImageComparison from "@/components/home/ImageComparison";
import { PLACEHOLDERS } from "@/lib/constants";

// 模拟数据获取函数
const getMemoryById = (id: string) => {
  const memories = [
    {
      id: "1",
      title: "古村落的晨曦",
      category: "建筑",
      location: "安徽 宏村",
      date: "2024-03-20",
      content: "宏村坐落于黄山西南麓，距黟县县城11公里。全村现保存完好的明清古民居有140余幢，是典型的徽派建筑。其布局之精巧，被称为“画里的乡村”。\n\n通过 AIGC 技术，我们对一组拍摄于 80 年代的褪色老照片进行了色彩还原与清晰度增强。在修复过程中，AI 学习了大量清代徽派建筑的细部特征，精准补全了剥落的马头墙纹理，并还原了当时清澈见底的南湖倒影。这种数字修复不仅是视觉上的提升，更是对乡村文化空间的数字化封存。",
      tags: ["徽派建筑", "世界文化遗产", "数字修复"],
      beforeImage: PLACEHOLDERS.OLD_PHOTO,
      afterImage: "https://images.unsplash.com/photo-1599591459325-ca64273895e6?auto=format&fit=crop&q=80&w=1200",
      author: "记忆守护者 - 小林",
      aiMethod: "Stable Diffusion XL + ControlNet (Canny/Scribble)"
    }
  ];
  return memories.find(m => m.id === id) || memories[0];
};

export default function MemoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [memory, setMemory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/memories/${id}`);
        if (response.ok) {
          const data = await response.json();
          // 格式化数据以匹配 UI
          setMemory({
            ...data,
            beforeImage: data.original_image_path ? `http://localhost:8080${data.original_image_path}` : PLACEHOLDERS.OLD_PHOTO,
            afterImage: data.restored_image_path ? `http://localhost:8080${data.restored_image_path}` : PLACEHOLDERS.AI_RESTORED,
            content: data.ai_polished_story || data.description,
            tags: data.tags ? data.tags.split(',') : ["乡村记忆", "AI修复"],
            aiMethod: "Stable Diffusion XL + DeepSeek-V3",
            date: new Date(data.created_at).toLocaleDateString()
          });
        }
      } catch (err) {
        console.error("Failed to fetch memory", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMemory();
    }
  }, [id]);

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
                      onClick={() => setLiked(!liked)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        liked 
                          ? "bg-red-50 border-red-200 text-red-500" 
                          : "bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50"
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${liked ? "fill-current" : ""}`} />
                      <span className="text-xs font-semibold">{liked ? "已收藏" : "喜欢"}</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-stone-800 border border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 transition-all">
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
