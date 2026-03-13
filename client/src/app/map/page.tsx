"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { useToast } from "@/components/ui/toast-provider";
import { API_BASE_URL } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Search, Filter, MapPin, Info, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface ApiMemoryNode {
  id: number;
  title: string;
  year: number;
  longitude: number;
  latitude: number;
  category: string;
}

interface MemoryNode {
  id: string | number;
  name: string;
  year: number;
  x: string;
  y: string;
  type: string;
}

const DEMO_NODES: MemoryNode[] = [];

export default function MapPage() {
  const toast = useToast();
  const [activeYear, setActiveYear] = useState(2024);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | number | null>(null);
  const [memoryNodes, setMemoryNodes] = useState<MemoryNode[]>([]);

  // Time controller auto-play
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveYear(prev => {
          if (prev >= 2024) {
            setIsPlaying(false);
            return 2024;
          }
          return prev + 1; // Play year by year
        });
      }, 100); // 0.1s per year
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/memories`);
        if (!response.ok) {
          toast.warning({ title: "地图数据暂不可用", description: "无法从服务器获取数据。" });
          setMemoryNodes([]);
          return;
        }

        const data: ApiMemoryNode[] = await response.json();
        const mapped: MemoryNode[] = data.map((memory) => ({
          id: memory.id,
          name: memory.title,
          year: memory.year,
          x: memory.longitude ? `${((memory.longitude - 73) / 62) * 100}%` : `${20 + Math.random() * 60}%`,
          y: memory.latitude ? `${((54 - memory.latitude) / 36) * 100}%` : `${20 + Math.random() * 60}%`,
          type: memory.category,
        }));

        setMemoryNodes(mapped);
      } catch {
        toast.warning({ title: "后端连接失败", description: "地图数据暂不可用。" });
        setMemoryNodes([]);
      }
    };

    void fetchMemories();
  }, [toast]);

  return (
    <div className="flex h-screen flex-col bg-stone-100 dark:bg-stone-950 overflow-hidden transition-colors duration-300">
      <Header />
      
      <main className="flex-grow pt-20 relative flex flex-col md:flex-row h-full overflow-hidden">
        {/* Sidebar Info */}
        <div className="w-full md:w-80 h-full flex flex-col bg-white dark:bg-stone-900 shadow-xl z-20 border-r border-stone-200 dark:border-stone-800">
          <div className="p-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">时空地图</h1>
              <Info className="w-5 h-5 text-stone-400 cursor-help" />
            </div>

            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="搜索记忆关键词..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-50 transition-all"
              />
            </div>

            <div className="space-y-6 mb-4">
              <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-800">
                <div className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-2">当前视角</div>
                <div className="text-lg font-bold text-stone-900 dark:text-stone-50">华东地区乡村记忆</div>
              </div>
              
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-400 dark:text-stone-500">活跃记忆点 ({memoryNodes.filter(n => n.year <= activeYear).length})</h3>
                <Filter className="w-4 h-4 text-stone-400 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-6 pt-0 space-y-4">
            <AnimatePresence mode="popLayout">
                {memoryNodes
                  .filter(node => node.year <= activeYear)
                  .map((node) => (
                    <motion.div 
                      key={node.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border shadow-sm group ${
                        selectedNodeId === node.id 
                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-2 ring-purple-100 dark:ring-purple-900" 
                          : "bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border-stone-50 dark:border-stone-700"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        selectedNodeId === node.id 
                          ? "bg-purple-100 dark:bg-purple-800" 
                          : "bg-stone-100 dark:bg-stone-900 group-hover:bg-stone-900 dark:group-hover:bg-stone-50"
                      }`}>
                        <MapPin className={`w-5 h-5 ${
                          selectedNodeId === node.id 
                            ? "text-purple-600 dark:text-purple-300" 
                            : "text-stone-400 group-hover:text-white dark:group-hover:text-stone-900"
                        }`} />
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <div className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">{node.name}</div>
                        <div className="text-xs text-stone-500">{node.type} · {node.year}年</div>
                      </div>
                      {selectedNodeId === node.id && (
                        <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      )}
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
        </div>

        {/* Map Area */}
        <div className="flex-grow z-10 relative bg-[#f1f2f4] dark:bg-stone-950 flex items-center justify-center overflow-hidden">
          {/* Map Grid Background */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5" style={{ 
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)", 
            backgroundSize: "40px 40px" 
          }}></div>

          {/* Simple Map Visualization */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full h-full max-w-4xl max-h-[70%] bg-stone-200 dark:bg-stone-900/50 rounded-full blur-[100px] opacity-20 pointer-events-none"
          ></motion.div>
          
          <div className="absolute inset-0 z-10">
            {memoryNodes.map((node) => {
              const isActive = selectedNodeId === node.id;
              return (
                <AnimatePresence key={node.id}>
                  {node.year <= activeYear && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: isActive ? 1.5 : 1, opacity: 1, zIndex: isActive ? 40 : 10 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: isActive ? 1.5 : 1.2, zIndex: 30 }}
                      style={{ left: node.x, top: node.y }}
                      onClick={() => setSelectedNodeId(isActive ? null : node.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all`}
                    >
                      <div className="relative">
                        {/* Pulse Effect */}
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                          isActive ? "bg-purple-600 dark:bg-purple-400" : "bg-stone-900 dark:bg-stone-100"
                        }`}></div>
                        <div className={`relative w-4 h-4 rounded-full shadow-lg border-2 transition-colors ${
                          isActive 
                            ? "bg-purple-600 border-white dark:border-stone-900" 
                            : "bg-stone-900 dark:bg-stone-100 border-white dark:border-stone-900"
                        }`}></div>
                        
                        {/* Tooltip */}
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 text-xs font-bold rounded whitespace-nowrap transition-opacity shadow-xl ${
                          isActive 
                            ? "opacity-100 bg-purple-600 text-white" 
                            : "opacity-0 group-hover:opacity-100 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                        }`}>
                          {node.name}
                          {isActive && <div className="text-[10px] font-normal mt-0.5 opacity-80">{node.type} · {node.year}年</div>}
                        </div>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
              );
            })}
          </div>

          {/* Selected Node Details Overlay */}
          <AnimatePresence>
            {selectedNodeId && (() => {
              const node = memoryNodes.find(n => n.id === selectedNodeId);
              if (!node || node.year > activeYear) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute top-6 right-6 w-72 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/50 dark:border-stone-800 z-40"
                >
                  <button 
                    onClick={() => setSelectedNodeId(null)}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 dark:hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2">{node.type}记忆</div>
                  <h3 className="text-xl font-black text-stone-900 dark:text-stone-50 mb-1">{node.name}</h3>
                  <div className="text-sm text-stone-500 font-medium mb-4">{node.year}年</div>
                  
                  <div className="aspect-video bg-stone-100 dark:bg-stone-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden border border-stone-200 dark:border-stone-700">
                    <div className="text-4xl">📸</div>
                  </div>
                  
                  <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                    承载着岁月痕迹的乡村记忆，记录了特定时代下的文化与生活方式变迁。它作为{node.year}年代的缩影，展现了{node.type}领域的独特魅力。
                  </p>
                  
                  <Link 
                    href={`/memories/${node.id}`}
                    className="w-full mt-4 flex py-2 px-4 bg-stone-900 dark:bg-stone-100 hover:bg-purple-600 dark:hover:bg-purple-500 text-white dark:text-stone-900 font-bold rounded-lg transition-colors text-sm items-center justify-center gap-2 group"
                  >
                    <span>查看完整档案</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <div className="relative z-10 text-center pointer-events-none">
             <div className="text-8xl mb-4 opacity-5">🗺️</div>
             <p className="text-stone-400 dark:text-stone-500 font-medium">交互式地图引擎正在加载历史坐标...</p>
          </div>

          {/* Time Controller */}
          <div className="absolute bottom-10 left-10 right-10 md:left-20 md:right-20 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/50 dark:border-stone-800 z-30">
            <div className="flex justify-between text-xs font-bold text-stone-400 mb-4 px-2 tracking-widest uppercase">
              <span>1900 世纪之交</span>
              <span>1950 时代变迁</span>
              <span>2000 千禧纪元</span>
              <span>2024 此刻</span>
            </div>
            <div className="relative pt-1">
              <input 
                type="range" 
                min="1900" 
                max="2024" 
                value={activeYear}
                onChange={(e) => setActiveYear(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-stone-100"
              />
              <div 
                className="absolute top-0 h-2 bg-stone-900/10 dark:bg-stone-100/10 rounded-lg pointer-events-none" 
                style={{ width: `${((activeYear - 1900) / 124) * 100}%` }}
              ></div>
            </div>
            <div className="mt-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => {
                     if (activeYear >= 2024 && !isPlaying) {
                       setActiveYear(1900); // Reset to start if finished
                     }
                     setIsPlaying(!isPlaying);
                   }}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                 >
                   {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                 </button>
                 <span className="text-stone-400 text-xs hidden sm:inline">拖动滑块或播放查看记忆随时间的流转变迁</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-[10px] font-bold rounded uppercase">Year</span>
                  <span className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tighter tabular-nums">{activeYear}</span>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
