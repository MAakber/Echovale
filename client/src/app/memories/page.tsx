"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MemoryCard from "@/components/home/MemoryCard";
import { GallerySkeleton } from "@/components/ui/gallery-skeleton";
import { useToast } from "@/components/ui/toast-provider";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, resolveAssetUrl } from "@/lib/constants";

interface ApiMemorySummary {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  ai_polished_story: string;
  restored_image_path: string;
}

export default function MemoriesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<Array<{
    id: string;
    title: string;
    category: string;
    location: string;
    imageUrl: string;
    excerpt: string;
  }>>([]);
  const [category, setCategory] = useState("全部");

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      try {
        const url = category === "全部"
          ? `${API_BASE_URL}/api/v1/memories`
          : `${API_BASE_URL}/api/v1/memories?category=${encodeURIComponent(category)}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data: ApiMemorySummary[] = await response.json();
          const formatted = data.map((m) => ({
            id: m.id.toString(),
            title: m.title,
            category: m.category,
            location: m.location,
            imageUrl: resolveAssetUrl(m.restored_image_path),
            excerpt: m.ai_polished_story || m.description
          }));

          setMemories(formatted);
        } else {
          toast.warning({ title: "记忆列表暂不可用", description: "当前未能从后端读取到该分类内容。" });
          setMemories([]);
        }
      } catch {
        toast.error({ title: "加载记忆失败", description: "请检查后端服务是否已经启动。" });
        setMemories([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchMemories();
  }, [category, toast]);

  const filteredMemories = memories;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950 transition-colors duration-300">
      <Header />
      
      <main className="flex-grow pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-stone-900 dark:text-stone-50 font-serif">数字记忆长廊</h1>
              <p className="text-stone-500 dark:text-stone-400 text-lg max-w-xl">
                穿越时空的隧道，探索那些被 AI 重新发现的乡村故事。每一个方块，都是一段不应被遗忘的历史。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {["全部", "建筑", "非遗", "民俗"].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat 
                      ? "bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 shadow-lg" 
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {loading ? (
            <GallerySkeleton />
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              <AnimatePresence>
                {filteredMemories.map((memory) => (
                  <MemoryCard key={memory.id} {...memory} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          
          {!loading && filteredMemories.length === 0 && (
            <div className="text-center py-20">
              <p className="text-stone-400">该分类下暂无记忆</p>
            </div>
          )}

          <div className="mt-20 text-center">
            <button className="px-8 py-3 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-full font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-sm">
              加载更多记忆
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
