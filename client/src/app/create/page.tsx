"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  NotebookPen,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/toast-provider";
import { API_BASE_URL, PLACEHOLDERS, resolveAssetUrl } from "@/lib/constants";

type AIProcessResponse = {
  url?: string;
  restored_url?: string;
  polished_story?: string;
  error?: string;
};

const AI_TOOL_OPTIONS = [
  {
    id: "deepseek",
    name: "纪实叙事模式",
    desc: "强调真实年代感和乡土细节，适合口述史、老建筑与村史片段。",
    accent: "from-amber-200 via-orange-100 to-white dark:from-amber-950/60 dark:via-stone-900 dark:to-stone-900",
    badge: "适合史料整理",
    icon: "💎",
  },
  {
    id: "tongyi",
    name: "视觉重构模式",
    desc: "更重视画面完整度与空间氛围，适合场景复原和记忆展示封面。",
    accent: "from-sky-200 via-cyan-100 to-white dark:from-cyan-950/60 dark:via-stone-900 dark:to-stone-900",
    badge: "默认推荐",
    icon: "🎨",
  },
  {
    id: "spark",
    name: "乡音讲述模式",
    desc: "保留叙述者口气，让文本更像被讲出来的故事，适合人物与传说。",
    accent: "from-emerald-200 via-lime-100 to-white dark:from-emerald-950/60 dark:via-stone-900 dark:to-stone-900",
    badge: "更有口述感",
    icon: "🗣️",
  },
] as const;

const STEP_LABELS = ["整理素材", "选择风格", "确认发布"] as const;

type AIToolId = (typeof AI_TOOL_OPTIONS)[number]["id"];

const AI_GENERATION_COUNTDOWN_SECONDS = 300;

function getToolMeta(toolId: AIToolId) {
  return AI_TOOL_OPTIONS.find((tool) => tool.id === toolId) ?? AI_TOOL_OPTIONS[1];
}

function formatCountdown(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (clamped % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function CreatePage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiCountdownSeconds, setAiCountdownSeconds] = useState(AI_GENERATION_COUNTDOWN_SECONDS);
  const [selectedTool, setSelectedTool] = useState<AIToolId>("tongyi");
  const [aiErrorMessage, setAiErrorMessage] = useState("");
  const [lastCompletedTool, setLastCompletedTool] = useState<AIToolId | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "建筑",
    description: "",
    restoredImage: "",
    aiPolishedStory: "",
    location: "未指定",
    year: new Date().getFullYear(),
  });

  const aiRequestLockRef = useRef(false);
  const selectedToolMeta = getToolMeta(selectedTool);

  useEffect(() => {
    if (!isAIGenerating) {
      return;
    }

    setAiCountdownSeconds(AI_GENERATION_COUNTDOWN_SECONDS);
    const timer = window.setInterval(() => {
      setAiCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isAIGenerating]);

  const resetAIResult = () => {
    setAiErrorMessage("");
    setLastCompletedTool(null);
    setFormData((prev) => ({
      ...prev,
      restoredImage: "",
      aiPolishedStory: "",
    }));
  };

  const nextStep = () => {
    if (step === 1 && !formData.description.trim()) {
      toast.warning({ title: "内容不完整", description: "请至少输入一段文字描述。" });
      return;
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAIProcess = async () => {
    if (aiRequestLockRef.current || isProcessing) {
      return;
    }

    if (!formData.description.trim()) {
      toast.warning({ title: "内容不完整", description: "请先补充文字描述，再开始 AI 创作。" });
      setStep(1);
      return;
    }

    aiRequestLockRef.current = true;
    setIsProcessing(true);
    setIsAIGenerating(true);
    setAiErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/process-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: formData.description,
          mode: selectedTool,
        }),
      });

      const result: AIProcessResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "AI 处理失败，请重试");
      }

      if (!result.polished_story) {
        throw new Error("AI 未返回可用的创作内容");
      }

      setFormData((prev) => ({
        ...prev,
        restoredImage: result.restored_url || "",
        aiPolishedStory: result.polished_story || "",
      }));
      setLastCompletedTool(selectedTool);
      toast.info({ title: "AI 创作完成", description: `${getToolMeta(selectedTool).name} 已生成新的图文草稿。` });
      setStep(3);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI 处理失败，请重试";
      setAiErrorMessage(message);
      toast.error({ title: "AI 创作失败", description: message });
    } finally {
      aiRequestLockRef.current = false;
      setIsAIGenerating(false);
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title || "未命名记忆",
          category: formData.category,
          description: formData.description,
          ai_polished_story: formData.aiPolishedStory,
          location: formData.location,
          latitude: 25 + Math.random() * 15,
          longitude: 100 + Math.random() * 20,
          year: parseInt(formData.year.toString(), 10),
          original_image_path: "",
          restored_image_path: formData.restoredImage,
          author: "匿名贡献者",
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      toast.info({ title: "发布成功", description: "记忆内容已保存，正在跳转到数字长廊。" });
      router.push("/memories");
    } catch {
      toast.error({ title: "发布失败", description: "请稍后重试。" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-stone-50 text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.12),_transparent_26%)]" />
      <Header />

      <main className="relative flex-grow pb-20 pt-28 md:pt-32">
        <div className="container mx-auto max-w-6xl px-6">
          <section className="mb-8 overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/88 p-6 shadow-[0_20px_80px_rgba(28,25,23,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/88 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-stone-400">Memory Studio</p>
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">把乡村记忆整理成一段可发布的图文档案</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300 md:text-lg">
                  现在创作页只保留文字驱动的生成流程。先把记忆讲清楚，再选择表达方式，最后确认发布，链路更短也更稳定。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { label: "输入", value: "纯文字描述" },
                  { label: "文本", value: `${formData.description.trim().length} 字描述` },
                  { label: "输出", value: "统一文生图" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4 dark:border-stone-800 dark:bg-stone-950/70">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-50">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            {STEP_LABELS.map((label, index) => {
              const currentStep = index + 1;
              const active = step === currentStep;
              const completed = step > currentStep;

              return (
                <div
                  key={label}
                  className={`rounded-[1.5rem] border px-5 py-4 transition-all ${
                    active
                      ? "border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-900/10 dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                      : completed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200"
                        : "border-stone-200 bg-white/70 text-stone-500 dark:border-stone-800 dark:bg-stone-900/70 dark:text-stone-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Step {currentStep}</p>
                      <p className="mt-2 text-lg font-semibold">{label}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-current/20 bg-white/10 text-sm font-bold">
                      {completed ? <CheckCircle2 className="h-5 w-5" /> : currentStep}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex min-h-[42rem] flex-col rounded-[2rem] border border-stone-200 bg-white/92 p-6 shadow-[0_24px_80px_rgba(28,25,23,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/92 md:p-8">
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">素材准备</p>
                    <h2 className="mt-3 text-3xl font-bold">先把记忆讲清楚</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500 dark:text-stone-400 md:text-base">
                      这一版不再提供图片输入，真正驱动生成的是下面这段文字。尽量写清人物、地点、时间和你记得的细节，输出会稳定很多。
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-6 dark:border-stone-800 dark:bg-stone-950/60">
                      <div className="mb-5 inline-flex rounded-2xl bg-white p-3 text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-50">
                        <NotebookPen className="h-6 w-6" />
                      </div>
                      <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300">记忆描述</label>
                      <textarea
                        value={formData.description}
                        onChange={(event) => {
                          resetAIResult();
                          setFormData((prev) => ({ ...prev, description: event.target.value }));
                        }}
                        className="mt-4 h-64 w-full rounded-[1.4rem] border border-stone-200 bg-white px-5 py-4 text-sm leading-7 text-stone-900 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
                        placeholder="例如：那年秋收后，村口晒场堆满玉米，老人坐在石凳上剥苞谷，风里有柴火和泥土的味道……"
                      />
                      <div className="mt-4 flex items-center justify-between text-xs text-stone-400 dark:text-stone-500">
                        <span>建议写出时间、地点、人物和一个最具体的场景动作。</span>
                        <span>{formData.description.trim().length} 字</span>
                      </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-400">创作方向</p>
                    <h2 className="mt-3 text-3xl font-bold">选择这段记忆的表达方式</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500 dark:text-stone-400 md:text-base">
                      当前流程只有一个图片生成路径，你只需要决定叙事气质和视觉倾向，避免过去“图生图 / 文生图”切换带来的理解成本。
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-5 dark:border-stone-800 dark:bg-stone-950/60">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">当前选择</p>
                        <p className="mt-2 text-xl font-semibold">{selectedToolMeta.name}</p>
                        <p className="mt-2 text-sm leading-7 text-stone-500 dark:text-stone-400">{selectedToolMeta.desc}</p>
                      </div>
                      <div className="rounded-[1.3rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
                        当前不会附带原图输入，生成结果完全取决于你的文字描述和所选表达模式。
                      </div>
                    </div>

                    {lastCompletedTool === selectedTool && formData.aiPolishedStory && (
                      <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
                        这个模式已经成功生成过结果。如果你刚刚修改了描述，可以直接再次执行一次创作。
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4">
                    {AI_TOOL_OPTIONS.map((tool) => {
                      const active = selectedTool === tool.id;

                      return (
                        <button
                          type="button"
                          key={tool.id}
                          onClick={() => {
                            setSelectedTool(tool.id);
                            setAiErrorMessage("");
                          }}
                          disabled={isProcessing}
                          aria-pressed={active}
                          className={`group relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br p-6 text-left transition ${tool.accent} ${
                            active
                              ? "border-stone-900 shadow-[0_18px_40px_rgba(28,25,23,0.12)] dark:border-stone-50"
                              : "border-stone-200 hover:border-stone-400 dark:border-stone-800 dark:hover:border-stone-700"
                          }`}
                        >
                          <div className="flex items-start gap-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/80 text-3xl shadow-sm dark:bg-stone-900/80">
                              {tool.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-50">{tool.name}</h3>
                                <span className="rounded-full border border-stone-300/70 bg-white/80 px-3 py-1 text-xs font-semibold text-stone-700 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-200">
                                  {tool.badge}
                                </span>
                              </div>
                              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600 dark:text-stone-300">{tool.desc}</p>
                            </div>
                            <div className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full border transition ${
                              active
                                ? "border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900"
                                : "border-stone-400/60 bg-white/70 text-transparent group-hover:text-stone-900 dark:border-stone-600 dark:bg-stone-900/70 dark:group-hover:text-stone-50"
                            }`}>
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>

                          {isProcessing && active && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-sm dark:bg-stone-950/55">
                              <Loader2 className="h-7 w-7 animate-spin text-stone-900 dark:text-stone-50" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {aiErrorMessage && (
                    <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">
                      {aiErrorMessage}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <div className="mb-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
                      <Sparkles className="mr-2 h-4 w-4" />
                      草稿已生成
                    </div>
                    <h2 className="text-3xl font-bold">确认标题，然后发布到数字长廊</h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500 dark:text-stone-400 md:text-base">
                      这一步只做最后确认。你可以给它一个更清晰的标题，然后直接提交保存。
                    </p>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">画面预览</p>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-stone-200 bg-stone-100 shadow-sm dark:border-stone-800 dark:bg-stone-800">
                        <Image
                          src={formData.restoredImage ? resolveAssetUrl(formData.restoredImage) : PLACEHOLDERS.AI_RESTORED}
                          alt="AI 生成预览"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">文本结果</p>
                      <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50/90 p-6 dark:border-stone-800 dark:bg-stone-950/60">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                          placeholder="给这段记忆起个标题，例如：老槐树下的夏夜"
                          className="w-full border-b border-stone-200 bg-transparent pb-3 text-2xl font-bold outline-none placeholder:text-stone-300 dark:border-stone-800 dark:placeholder:text-stone-600"
                        />
                        <div className="mt-6 rounded-[1.4rem] bg-white px-5 py-5 text-sm leading-8 text-stone-700 shadow-sm dark:bg-stone-900 dark:text-stone-200">
                          {formData.aiPolishedStory || "AI 正在生成更完整的乡村叙事文本..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto flex flex-col gap-4 border-t border-stone-100 pt-8 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={prevStep}
                  disabled={isProcessing}
                  className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                    step === 1
                      ? "invisible"
                      : "border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-stone-50"
                  }`}
                >
                  返回上一步
                </button>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  {isAIGenerating && (
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-400 dark:text-stone-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>
                        {aiCountdownSeconds > 0
                          ? `图片生成中，预计剩余 ${formatCountdown(aiCountdownSeconds)}`
                          : "图片仍在生成，已超过预计时间，请继续等待"}
                      </span>
                    </div>
                  )}
                  {!isAIGenerating && isProcessing && step === 3 && (
                    <div className="flex items-center gap-2 text-xs font-medium text-stone-400 dark:text-stone-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>正在发布，请稍候</span>
                    </div>
                  )}
                  <button
                    onClick={step === 3 ? handleSubmit : step === 2 ? () => void handleAIProcess() : nextStep}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
                  >
                    {step === 3 ? "发布到数字长廊" : step === 2 ? (aiErrorMessage ? "重新执行创作" : "开始 AI 创作") : "继续下一步"}
                    {!isProcessing && <ArrowRight className="h-4 w-4" />}
                    {isProcessing && step !== 3 && <WandSparkles className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-stone-200 bg-white/92 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.06)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/92">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-400">当前摘要</p>
                <div className="mt-5 space-y-5">
                  <div>
                    <p className="text-sm text-stone-400">创作风格</p>
                    <p className="mt-1 text-lg font-semibold">{selectedToolMeta.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">素材状态</p>
                    <p className="mt-1 text-lg font-semibold">仅文字创作</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-400">文本准备度</p>
                    <p className="mt-1 text-lg font-semibold">{formData.description.trim() ? "已填写描述" : "待补充描述"}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-900 text-stone-50 shadow-[0_20px_60px_rgba(28,25,23,0.12)] dark:border-stone-800">
                <div className="bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(255,255,255,0.02)_45%,rgba(56,189,248,0.18))] p-6">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-300">输出说明</p>
                  <h3 className="mt-3 text-2xl font-semibold">统一文生图后，路径更清楚</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-300">
                    现在图片生成始终基于文字描述执行。这样能减少失败分支，也让创作反馈更一致。
                  </p>
                </div>
                <div className="space-y-3 p-6 text-sm leading-7 text-stone-300">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">1. 先写清具体场景，而不是抽象感受。</div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">2. 多写一个可被看见的动作，画面更容易稳定。</div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3">3. 标题尽量短，让长廊列表更容易浏览。</div>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
