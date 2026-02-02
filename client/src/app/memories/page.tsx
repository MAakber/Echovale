"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MemoryCard from "@/components/home/MemoryCard";
import { GallerySkeleton } from "@/components/ui/gallery-skeleton";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_MEMORIES = [
  {
    id: "1",
    title: "古村落的晨曦",
    category: "建筑",
    location: "安徽 宏村",
    imageUrl: "https://images.unsplash.com/photo-1599591459325-ca64273895e6?auto=format&fit=crop&q=80&w=800",
    excerpt: "徽派建筑的独特韵律，在现代 AI 的笔触下焕发新生。白墙黑瓦，倒映在南湖的晨光中。"
  },
  {
    id: "2",
    title: "皮影戏：光影传说",
    category: "非遗",
    location: "陕西 华县",
    imageUrl: "https://images.unsplash.com/photo-1635349581701-d7790b79086c?auto=format&fit=crop&q=80&w=800",
    excerpt: "跳动的指尖，诉说着千年的故事。数字修复让模糊的皮影纹理重新清晰，留住这门艺术的灵魂。"
  },
  {
    id: "3",
    title: "梯田上的歌谣",
    category: "民俗",
    location: "云南 元阳",
    imageUrl: "https://images.unsplash.com/photo-1543161092-23961d2d0985?auto=format&fit=crop&q=80&w=800",
    excerpt: "层层叠叠的梯田，是大地最美的指纹。哈尼族先民的智慧，在数字三维建模中展现无遗。"
  },
  {
    id: "4",
    title: "老街的旧时光",
    category: "建筑",
    location: "福建 泉州",
    imageUrl: "https://images.unsplash.com/photo-1587842668502-3c30656a88e9?auto=format&fit=crop&q=80&w=800",
    excerpt: "红砖厝里，藏着下南洋的故事。AI 对老街色彩的精准还原，带你回到那个红火的时代。"
  },
  {
    id: "5",
    title: "苗寨银饰盛装",
    category: "非遗",
    location: "贵州 西江",
    imageUrl: "https://images.unsplash.com/photo-1605341203975-ad3473950c76?auto=format&fit=crop&q=80&w=800",
    excerpt: "精美绝伦的银饰，承载着民族的信仰。超清晰影像建模，让每一处錾刻纹样都清晰可见。"
  },
  {
    id: "6",
    title: "窑火传承：寻找瓷魂",
    category: "非遗",
    location: "江西 景德镇",
    imageUrl: "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?auto=format&fit=crop&q=80&w=800",
    excerpt: "炉火纯青的背后，是匠人一生的坚守。数字孪生技术记录了瓷源的演化与重构过程。"
  }
];

export default function MemoriesPage() {
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState(MOCK_MEMORIES);
  const [category, setCategory] = useState("全部");

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      try {
        const url = category === "全部" 
          ? "http://localhost:8080/api/v1/memories" 
          : `http://localhost:8080/api/v1/memories?category=${encodeURIComponent(category)}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const formatted = data.map((m: any) => ({
            id: m.id.toString(),
            title: m.title,
            category: m.category,
            location: m.location,
            imageUrl: m.restored_image_path ? `http://localhost:8080${m.restored_image_path}` : "",
            excerpt: m.ai_polished_story || m.description
          }));

          if (category === "全部") {
            setMemories([...MOCK_MEMORIES, ...formatted]);
          } else {
            const mockFiltered = MOCK_MEMORIES.filter(m => m.category === category);
            setMemories([...mockFiltered, ...formatted]);
          }
        }
      } catch (err) {
        console.log("Using mock data as backend is unreachable");
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [category]);

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
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-stone-900 dark:text-stone-50 font-serif italic">数字记忆长廊</h1>
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
