"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { API_BASE_URL } from "@/lib/constants";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, MapPin, Info } from "lucide-react";

export default function MapPage() {
  const [activeYear, setActiveYear] = useState(2024);
  const [isLoaded, setIsLoaded] = useState(false);
  const [memoryNodes, setMemoryNodes] = useState<any[]>([]);

  useEffect(() => {
    setIsLoaded(true);
    const fetchMemories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/memories`);
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((m: any) => ({
            id: m.id,
            name: m.title,
            year: m.year,
            // 如果后端没有坐标，使用默认模拟坐标
            x: m.longitude ? `${((m.longitude - 73) / 62) * 100}%` : `${20 + Math.random() * 60}%`,
            y: m.latitude ? `${((54 - m.latitude) / 36) * 100}%` : `${20 + Math.random() * 60}%`,
            type: m.category
          }));
          
          // 合并初始演示数据和后端数据
          const initialNodes = [
            { id: "d1", name: "徽州古落", year: 1940, x: "30%", y: "45%", type: "建筑" },
            { id: "d2", name: "渭水皮影", year: 1960, x: "55%", y: "30%", type: "非遗" },
            { id: "d3", name: "苗岭歌会", year: 1980, x: "40%", y: "70%", type: "民俗" },
            { id: "d4", name: "东海渔场", year: 1920, x: "75%", y: "55%", type: "历史" },
            { id: "d5", name: "塞北马帮", year: 2000, x: "60%", y: "20%", type: "交通" },
          ];
          setMemoryNodes([...initialNodes, ...mapped]);
        }
      } catch (err) {
        console.warn("Backend unavailable, using local nodes");
      }
    };
    fetchMemories();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-stone-100 dark:bg-stone-950 overflow-hidden transition-colors duration-300">
      <Header />
      
      <main className="flex-grow pt-20 relative flex flex-col md:flex-row">
        {/* Sidebar Info */}
        <div className="w-full md:w-80 bg-white dark:bg-stone-900 shadow-xl z-20 p-6 overflow-y-auto border-r border-stone-200 dark:border-stone-800">
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

          <div className="space-y-6">
            <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-xl border border-stone-100 dark:border-stone-800">
              <div className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase mb-2">当前视角</div>
              <div className="text-lg font-bold text-stone-900 dark:text-stone-50">华东地区乡村记忆</div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-400 dark:text-stone-500">活跃记忆点 ({memoryNodes.filter(n => n.year <= activeYear).length})</h3>
                <Filter className="w-4 h-4 text-stone-400 cursor-pointer" />
              </div>
              
              <AnimatePresence mode="popLayout">
                {memoryNodes
                  .filter(node => node.year <= activeYear)
                  .map((node) => (
                    <motion.div 
                      key={node.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-xl cursor-pointer transition-all border border-stone-50 dark:border-stone-700 shadow-sm group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-900 flex items-center justify-center group-hover:bg-stone-900 dark:group-hover:bg-stone-50 transition-colors">
                        <MapPin className="w-5 h-5 text-stone-400 group-hover:text-white dark:group-hover:text-stone-900" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-stone-800 dark:text-stone-200">{node.name}</div>
                        <div className="text-xs text-stone-500">{node.type} · {node.year}年</div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-grow relative bg-[#f1f2f4] dark:bg-stone-950 flex items-center justify-center overflow-hidden">
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
            {isLoaded && memoryNodes.map((node) => (
              <AnimatePresence key={node.id}>
                {node.year <= activeYear && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.2, zIndex: 30 }}
                    style={{ left: node.x, top: node.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  >
                    <div className="relative">
                      {/* Pulse Effect */}
                      <div className="absolute inset-0 rounded-full bg-stone-900 dark:bg-stone-100 animate-ping opacity-20"></div>
                      <div className="relative w-4 h-4 rounded-full bg-stone-900 dark:bg-stone-100 shadow-lg border-2 border-white dark:border-stone-900"></div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {node.name} ({node.year})
                      </div>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            ))}
          </div>

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
               <span className="text-stone-400 text-xs">拖动滑块查看记忆随时间的流转变迁</span>
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
