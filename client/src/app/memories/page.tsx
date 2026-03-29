"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MemoryCard from "@/components/home/MemoryCard";
import { GallerySkeleton } from "@/components/ui/gallery-skeleton";
import { useToast } from "@/components/ui/toast-provider";
import { API_BASE_URL, resolveAssetUrl } from "@/lib/constants";

interface ApiMemorySummary {
  id: number;
  title: string;
  category: string;
  location: string;
  description: string;
  ai_polished_story: string;
  restored_image_path: string;
  tags?: string;
  year?: number;
  created_at?: string;
}

type DisplayMemory = {
  id: string;
  title: string;
  category: string;
  location: string;
  imageUrl: string;
  excerpt: string;
  tags: string[];
  year: number;
  town: string;
};

function extractTown(location: string): string {
  const parts = location
    .split(/[\s,，、\-]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "未知城镇";
  }

  return parts[parts.length - 1];
}

function calculatePercent(value: number, min: number, max: number) {
  if (!max || max < min) {
    return 0;
  }
  if (max === min) {
    return 50;
  }
  return ((value - min) / (max - min)) * 100;
}

function resolveMemoryYear(year?: number, createdAt?: string): number {
  if (typeof year === "number" && year > 0) {
    return year;
  }

  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      if (y >= 1000 && y <= 3000) {
        return y;
      }
    }
  }

  return 0;
}

function formatEndYearLabel(value: number, currentYear: number): string {
  return value >= currentYear ? String(currentYear) : String(value);
}

export default function MemoriesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState<DisplayMemory[]>([]);
  const [category, setCategory] = useState("全部");
  const [town, setTown] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [yearRange, setYearRange] = useState<{ from: number; to: number } | null>(null);
  const [activeHandle, setActiveHandle] = useState<"from" | "to" | null>(null);
  const yearTrackRef = useRef<HTMLDivElement | null>(null);

  const categories = [
    "全部",
    ...Array.from(new Set(memories.map((memory) => memory.category))).sort((a, b) => a.localeCompare(b, "zh-CN")),
  ];

  const towns = [
    "全部",
    ...Array.from(new Set(memories.map((memory) => memory.town))).sort((a, b) => a.localeCompare(b, "zh-CN")),
  ];

  const years = memories.map((memory) => memory.year).filter((year) => year > 0);
  const hasYearData = years.length > 0;
  const timelinePaddingYears = 40;
  const minTimelineYear = 1900;
  const currentYear = new Date().getFullYear();
  const defaultMaxYear = currentYear;
  const defaultMinYear = currentYear - 100;
  const dataMinYear = hasYearData ? Math.min(...years) : defaultMinYear;
  const dataMaxYear = hasYearData ? Math.min(Math.max(...years), currentYear) : defaultMaxYear;
  const minYear = Math.max(minTimelineYear, dataMinYear - timelinePaddingYears);
  const maxYear = Math.max(defaultMaxYear, dataMaxYear);

  const fromPercent = calculatePercent(yearRange?.from ?? minYear, minYear, maxYear);
  const toPercent = calculatePercent(yearRange?.to ?? maxYear, minYear, maxYear);

  const handleGap = Math.abs(toPercent - fromPercent);
  const fromBubbleOffset = handleGap < 10 ? -18 : 0;
  const toBubbleOffset = handleGap < 10 ? 18 : 0;
  const timelineSpan = Math.max(maxYear - minYear, 0);

  const yearTicks = useMemo(() => {
    if (minYear === maxYear) {
      return [minYear];
    }

    const candidates = [
      minYear,
      Math.round(minYear + (maxYear - minYear) * 0.25),
      Math.round(minYear + (maxYear - minYear) * 0.5),
      Math.round(minYear + (maxYear - minYear) * 0.75),
      maxYear,
    ];

    return Array.from(new Set(candidates)).sort((a, b) => a - b);
  }, [minYear, maxYear]);

  useEffect(() => {
    const fetchMemories = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/memories`);
        if (response.ok) {
          const data: ApiMemorySummary[] = await response.json();
          const formatted = data.map((item) => ({
            id: item.id.toString(),
            title: item.title,
            category: item.category,
            location: item.location,
            imageUrl: resolveAssetUrl(item.restored_image_path),
            excerpt: item.ai_polished_story || item.description,
            tags: (item.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
            year: resolveMemoryYear(item.year, item.created_at),
            town: extractTown(item.location || ""),
          }));
          setMemories(formatted);
        } else {
          toast.warning({ title: "记忆列表暂不可用", description: "当前未能从后端读取到内容。" });
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
  }, [toast]);

  useEffect(() => {
    setYearRange((prev) => {
      if (!prev) {
        return { from: minYear, to: maxYear };
      }

      const nextFrom = Math.max(minYear, Math.min(prev.from, maxYear));
      const nextTo = Math.min(maxYear, Math.max(prev.to, minYear));
      return {
        from: Math.min(nextFrom, nextTo),
        to: Math.max(nextFrom, nextTo),
      };
    });
  }, [minYear, maxYear]);

  const updateRangeByClientX = (clientX: number, handle: "from" | "to") => {
    if (!yearTrackRef.current || !yearRange) {
      return;
    }

    const rect = yearTrackRef.current.getBoundingClientRect();
    if (rect.width <= 0) {
      return;
    }

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const value = Math.round(minYear + ratio * (maxYear - minYear));

    setYearRange((prev) => {
      if (!prev) {
        return prev;
      }

      if (handle === "from") {
        return { from: Math.min(value, prev.to), to: prev.to };
      }

      return { from: prev.from, to: Math.max(value, prev.from) };
    });
  };

  const filteredMemories = memories.filter((memory) => {
    const byCategory = category === "全部" || memory.category === category;
    const byTown = town === "全部" || memory.town === town;
    const byKeyword = keyword.trim()
      ? memory.title.includes(keyword) ||
        memory.excerpt.includes(keyword) ||
        memory.location.includes(keyword) ||
        memory.tags.some((tag) => tag.includes(keyword))
      : true;
    const byYear = yearRange
      ? memory.year === 0 || (memory.year >= yearRange.from && memory.year <= yearRange.to)
      : true;

    return byCategory && byTown && byKeyword && byYear;
  });

  const townStats = Object.entries(
    memories.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.town] = (acc[memory.town] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const clearFilters = () => {
    setCategory("全部");
    setTown("全部");
    setKeyword("");
    setYearRange({ from: minYear, to: maxYear });
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 transition-colors duration-300 dark:bg-stone-950">
      <Header />

      <main className="grow pb-20 pt-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8 overflow-hidden rounded-4xl border border-stone-200 bg-white/90 p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900/85"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-r from-amber-100/60 via-sky-100/40 to-emerald-100/50 dark:from-amber-900/20 dark:via-sky-900/10 dark:to-emerald-900/15" />
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="mb-4 font-serif text-4xl font-bold text-stone-900 dark:text-stone-50 md:text-5xl">数字记忆长廊</h1>
                <p className="max-w-3xl text-base leading-8 text-stone-500 dark:text-stone-400 md:text-lg">
                  这里是乡村数字档案的展示中心。你可以按分类、城镇、关键词和年代筛选，快速查看每条记忆的图文成果，并继续进入地图或创作流程。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/70">
                  <p className="text-xs text-stone-400">档案总数</p>
                  <p className="mt-1 text-lg font-bold">{memories.length}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/70">
                  <p className="text-xs text-stone-400">覆盖城镇</p>
                  <p className="mt-1 text-lg font-bold">{Math.max(towns.length - 1, 0)}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/70">
                  <p className="text-xs text-stone-400">最早年份</p>
                  <p className="mt-1 text-lg font-bold">{minYear || "-"}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/70">
                  <p className="text-xs text-stone-400">最新年份</p>
                  <p className="mt-1 text-lg font-bold">{formatEndYearLabel(maxYear, currentYear)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <section className="mb-8 rounded-4xl border border-stone-200 bg-white/90 p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/85">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto]">
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索关键词、标题、地点"
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900"
              />
              <select
                value={town}
                onChange={(event) => setTown(event.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900"
              >
                {towns.map((item) => (
                  <option key={item} value={item}>{item === "全部" ? "全部城镇" : item}</option>
                ))}
              </select>
              <button
                onClick={clearFilters}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
              >
                清除筛选
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-3xl border border-stone-200/90 bg-linear-to-br from-white via-stone-50 to-emerald-50/40 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:border-stone-700 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/20">
              <div className="pointer-events-none absolute" />
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-700 dark:text-stone-200">年份滑动筛选</p>
                  <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">单轨双点: 左侧是起始年份，右侧是结束年份。</p>
                  <p className="mt-1 text-[11px] tracking-wide text-stone-400 dark:text-stone-500">时间跨度 {timelineSpan} 年</p>
                </div>
                <span className="rounded-full border border-stone-300 bg-white/80 px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-100">
                  {yearRange
                    ? `${yearRange.from} - ${formatEndYearLabel(yearRange.to, currentYear)}`
                    : `${minYear} - ${formatEndYearLabel(maxYear, currentYear)}`}
                </span>
              </div>

              {!hasYearData && (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                  当前档案缺少明确年份，已启用默认时间轴供你先筛选与定位。
                </p>
              )}

              <div className="rounded-2xl border border-stone-200 bg-white/90 px-3 py-3 shadow-inner dark:border-stone-700 dark:bg-stone-900/80">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-600 dark:text-stone-300">拖动年份区间</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-stone-200 bg-stone-100 px-2 py-0.5 font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200">起: {yearRange?.from ?? "-"}</span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300">止: {yearRange ? formatEndYearLabel(yearRange.to, currentYear) : "-"}</span>
                  </div>
                </div>

                <div
                  ref={yearTrackRef}
                  className="relative h-16 select-none touch-none"
                  onPointerDown={(event) => {
                    if (!yearRange || !yearTrackRef.current) {
                      return;
                    }

                    const rect = yearTrackRef.current.getBoundingClientRect();
                    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
                    const value = Math.round(minYear + ratio * (maxYear - minYear));
                    const pick = Math.abs(value - yearRange.from) <= Math.abs(value - yearRange.to) ? "from" : "to";

                    setActiveHandle(pick);
                    event.currentTarget.setPointerCapture(event.pointerId);
                    updateRangeByClientX(event.clientX, pick);
                  }}
                  onPointerMove={(event) => {
                    if (!activeHandle) {
                      return;
                    }
                    updateRangeByClientX(event.clientX, activeHandle);
                  }}
                  onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    setActiveHandle(null);
                  }}
                  onPointerCancel={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                    setActiveHandle(null);
                  }}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-stone-200/80 dark:bg-stone-700/80" />

                  <div
                    className="pointer-events-none absolute top-0 z-40 rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm dark:bg-stone-100 dark:text-stone-900"
                    style={{
                      left: `calc(${fromPercent}% + ${fromBubbleOffset}px)`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {yearRange?.from ?? minYear}
                  </div>
                  <div
                    className="pointer-events-none absolute top-0 z-40 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
                    style={{
                      left: `calc(${toPercent}% + ${toBubbleOffset}px)`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {formatEndYearLabel(yearRange?.to ?? maxYear, currentYear)}
                  </div>

                  <div className="absolute left-0 top-1/2 h-2.5 w-full -translate-y-1/2 rounded-full bg-linear-to-r from-stone-300 via-stone-200 to-stone-300 shadow-inner dark:from-stone-700 dark:via-stone-600 dark:to-stone-700" />
                  <div
                    className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full bg-linear-to-r from-cyan-500 via-teal-500 to-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.45)]"
                    style={{
                      left: `${fromPercent}%`,
                      width: `${Math.max(toPercent - fromPercent, 0)}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 z-30 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-stone-800 bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.8)] transition-transform hover:scale-110 dark:border-stone-200"
                    style={{ left: `calc(${fromPercent}% - 10px)` }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setActiveHandle("from");
                      if (yearTrackRef.current) {
                        yearTrackRef.current.setPointerCapture(event.pointerId);
                      }
                    }}
                  />
                  <div
                    className="absolute top-1/2 z-30 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-emerald-700 bg-white shadow-[0_0_0_3px_rgba(16,185,129,0.25)] transition-transform hover:scale-110"
                    style={{ left: `calc(${toPercent}% - 10px)` }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setActiveHandle("to");
                      if (yearTrackRef.current) {
                        yearTrackRef.current.setPointerCapture(event.pointerId);
                      }
                    }}
                  />
                </div>

                <div className="mt-2 relative h-8 border-t border-dashed border-stone-200 pt-1 dark:border-stone-700">
                  {yearTicks.map((tick) => {
                    const tickPercent = calculatePercent(tick, minYear, maxYear);
                    return (
                      <div
                        key={tick}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${tickPercent}%` }}
                      >
                        <div className="mx-auto h-2 w-px bg-stone-500 dark:bg-stone-400" />
                        <div className="mt-1 rounded-full bg-stone-100/90 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-stone-700 shadow-sm dark:bg-stone-800 dark:text-stone-200">{tick === maxYear ? formatEndYearLabel(tick, currentYear) : tick}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    category === cat
                      ? "bg-stone-900 text-white shadow-lg dark:bg-stone-50 dark:text-stone-900"
                      : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {townStats.map(([townName, count]) => (
                <button
                  key={townName}
                  onClick={() => setTown(townName)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    town === townName
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200"
                  }`}
                >
                  {townName} · {count}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-10 grid gap-4 md:grid-cols-3">
            <Link href="/map" className="rounded-3xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">时空联动</p>
              <h3 className="mt-2 text-xl font-bold">进入地图查看分布</h3>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">把记忆放到真实地理位置上阅读。</p>
            </Link>
            <Link href="/create" className="rounded-3xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">继续创作</p>
              <h3 className="mt-2 text-xl font-bold">新增一条数字档案</h3>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">按结构化字段提交新的乡村记忆。</p>
            </Link>
            <Link href="/admin" className="rounded-3xl border border-stone-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">管理入口</p>
              <h3 className="mt-2 text-xl font-bold">进入管理台维护</h3>
              <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">查看配置并维护档案数据质量。</p>
            </Link>
          </section>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-stone-200/80 px-3 py-1 dark:bg-stone-800">结果数: {filteredMemories.length}</span>
            {category !== "全部" && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">分类: {category}</span>}
            {town !== "全部" && <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">城镇: {town}</span>}
            {keyword.trim() && <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">关键词: {keyword.trim()}</span>}
            {yearRange && <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200">年代: {yearRange.from} - {formatEndYearLabel(yearRange.to, currentYear)}</span>}
          </div>

          {loading ? (
            <GallerySkeleton />
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence>
                {filteredMemories.map((memory) => (
                  <MemoryCard key={memory.id} {...memory} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && filteredMemories.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-stone-400">当前筛选条件下暂无记忆，请尝试放宽关键词或年份范围。</p>
            </div>
          )}

          <div className="mt-20 text-center">
            <button className="rounded-full border border-stone-200 bg-white px-8 py-3 font-semibold text-stone-900 shadow-sm transition-all hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800">
              加载更多记忆
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
