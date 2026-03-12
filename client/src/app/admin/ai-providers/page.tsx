"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/toast-provider";
import { API_BASE_URL } from "@/lib/constants";
import Image from "next/image";
import { Loader2, Save, Settings2, WandSparkles } from "lucide-react";

interface TextProviderConfig {
  provider_name: string;
  api_key: string;
  model: string;
  base_url: string;
  site_url: string;
  site_name: string;
}

interface ImageProviderConfig {
  provider_name: string;
  api_key: string;
  model: string;
  base_url: string;
  width: string;
  height: string;
}

interface AIProviderSettings {
  text: TextProviderConfig;
  image: ImageProviderConfig;
  updated_at?: string;
}

interface ProviderTestResult {
  message: string;
  provider_name?: string;
  model?: string;
  sample_output?: string;
  preview_url?: string;
}

const EMPTY_SETTINGS: AIProviderSettings = {
  text: {
    provider_name: "",
    api_key: "",
    model: "",
    base_url: "",
    site_url: "",
    site_name: "",
  },
  image: {
    provider_name: "",
    api_key: "",
    model: "",
    base_url: "",
    width: "",
    height: "",
  },
};

export default function AdminAIProvidersPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<AIProviderSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [textTesting, setTextTesting] = useState(false);
  const [imageTesting, setImageTesting] = useState(false);
  const [textTestResult, setTextTestResult] = useState<ProviderTestResult | null>(null);
  const [imageTestResult, setImageTestResult] = useState<ProviderTestResult | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/ai-providers`);
      if (!response.ok) {
        throw new Error("failed to fetch settings");
      }

      const data: AIProviderSettings = await response.json();
      setSettings(data);
    } catch {
      toast.error({ title: "读取 AI 配置失败", description: "请确认后端服务已经启动。" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateTextField = <K extends keyof TextProviderConfig>(key: K, value: TextProviderConfig[K]) => {
    setSettings((current) => ({
      ...current,
      text: { ...current.text, [key]: value },
    }));
  };

  const updateImageField = <K extends keyof ImageProviderConfig>(key: K, value: ImageProviderConfig[K]) => {
    setSettings((current) => ({
      ...current,
      image: { ...current.image, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/ai-providers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "保存失败");
      }

      setSettings(result);
      toast.info({ title: "AI 配置已保存", description: "新的创作请求将立即使用这套配置。" });
    } catch (err) {
      toast.error({ title: "保存 AI 配置失败", description: err instanceof Error ? err.message : "请稍后重试。" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestText = async () => {
    setTextTesting(true);
    setTextTestResult(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 22000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/ai-providers/test-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: settings.text }),
        signal: controller.signal,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "文本供应商测试失败");
      }

      setTextTestResult(result);
      toast.info({ title: "文本供应商测试成功", description: "当前配置可以正常返回内容。" });
    } catch (err) {
      const description = err instanceof DOMException && err.name === "AbortError"
        ? "请求超时。请确认后端已启动，或更换响应更快的模型后重试。"
        : err instanceof Error
          ? err.message
          : "请稍后重试。";

      toast.error({ title: "文本供应商测试失败", description });
    } finally {
      window.clearTimeout(timeoutId);
      setTextTesting(false);
    }
  };

  const handleTestImage = async () => {
    setImageTesting(true);
    setImageTestResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/admin/ai-providers/test-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: settings.image }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "图片供应商测试失败");
      }

      setImageTestResult(result);
      toast.info({ title: "图片供应商测试成功", description: "当前配置已经生成了一张测试图。" });
    } catch (err) {
      toast.error({ title: "图片供应商测试失败", description: err instanceof Error ? err.message : "请稍后重试。" });
    } finally {
      setImageTesting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-stone-50 text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.16),_transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.1),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_22%)]" />
      <Header />

      <main className="relative flex-grow pt-32 pb-20">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-10 overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/88 p-7 shadow-[0_20px_80px_rgba(28,25,23,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/88">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-stone-400">AI Provider Console</p>
                <h1 className="mb-4 text-4xl font-bold md:text-5xl font-serif">AI 配置台</h1>
                <p className="text-lg leading-relaxed text-stone-500 dark:text-stone-400">
                  这里管理 AI 文本与图片创作所依赖的 API 供应商。图片测试已统一为文生图校验，配置台只保留必要操作，减少干扰信息。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800"
                >
                  返回记忆管理台
                </Link>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  保存配置
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-[2rem] border border-stone-200 bg-white py-24 dark:border-stone-800 dark:bg-stone-900">
              <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
          ) : (
            <div className="grid gap-8 xl:grid-cols-2">
              <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <div className="mb-6 flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-stone-400" />
                  <div>
                    <h2 className="text-2xl font-bold">文本 AI 供应商</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">用于记忆润色与叙事生成，要求接口兼容聊天补全。</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleTestText}
                    disabled={loading || saving || textTesting}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-200 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50 dark:hover:bg-stone-700"
                  >
                    {textTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                    测试文本供应商
                  </button>
                </div>

                <div className="grid gap-5">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">供应商名称</span>
                    <input value={settings.text.provider_name} onChange={(event) => updateTextField("provider_name", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="例如 OpenRouter、硅基流动、自建网关" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">API Base URL</span>
                    <input value={settings.text.base_url} onChange={(event) => updateTextField("base_url", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="https://example.com/v1/chat/completions" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">模型名</span>
                    <input value={settings.text.model} onChange={(event) => updateTextField("model", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="deepseek/deepseek-chat-v3-0324:free" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">API Key</span>
                    <input value={settings.text.api_key} onChange={(event) => updateTextField("api_key", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="sk-..." />
                  </label>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-600 dark:text-stone-300">站点 URL</span>
                      <input value={settings.text.site_url} onChange={(event) => updateTextField("site_url", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="http://localhost:3000" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-600 dark:text-stone-300">站点名称</span>
                      <input value={settings.text.site_name} onChange={(event) => updateTextField("site_name", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="乡村回响" />
                    </label>
                  </div>
                </div>

                {textTestResult && (
                  <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
                    <p className="font-semibold">{textTestResult.message}</p>
                    <p className="mt-2 text-emerald-800/80 dark:text-emerald-100/80">
                      当前测试配置：{textTestResult.provider_name || "未命名供应商"} / {textTestResult.model || "未填写模型"}
                    </p>
                    {textTestResult.sample_output && (
                      <p className="mt-3 rounded-2xl bg-white/70 px-4 py-3 leading-relaxed text-stone-700 dark:bg-stone-900/60 dark:text-stone-200">
                        {textTestResult.sample_output}
                      </p>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900">
                <div className="mb-6 flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-stone-400" />
                  <div>
                    <h2 className="text-2xl font-bold">图片 AI 供应商</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">用于生成创作预览图。当前只保留文生图测试，输出更稳定，配置也更直观。</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleTestImage}
                    disabled={loading || saving || imageTesting}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-900 transition hover:bg-stone-200 disabled:opacity-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50 dark:hover:bg-stone-700"
                  >
                    {imageTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                    测试图片供应商
                  </button>
                </div>

                <div className="grid gap-5">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">供应商名称</span>
                    <input value={settings.image.provider_name} onChange={(event) => updateImageField("provider_name", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="例如 OpenRouter、Pollinations、自建服务" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">API Base URL</span>
                    <input value={settings.image.base_url} onChange={(event) => updateImageField("base_url", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="https://image.pollinations.ai/prompt" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">模型名</span>
                    <input value={settings.image.model} onChange={(event) => updateImageField("model", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="例如 flux；若用 OpenRouter 请填写支持图片输出的收费模型" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">API Key</span>
                    <input value={settings.image.api_key} onChange={(event) => updateImageField("api_key", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="没有可留空" />
                  </label>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-600 dark:text-stone-300">输出宽度</span>
                      <input value={settings.image.width} onChange={(event) => updateImageField("width", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="1024" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-600 dark:text-stone-300">输出高度</span>
                      <input value={settings.image.height} onChange={(event) => updateImageField("height", event.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-stone-400 dark:border-stone-800 dark:bg-stone-950" placeholder="768" />
                    </label>
                  </div>
                </div>

                {imageTestResult && (
                  <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
                    <p className="font-semibold">{imageTestResult.message}</p>
                    <p className="mt-2 text-emerald-800/80 dark:text-emerald-100/80">
                      当前测试配置：{imageTestResult.provider_name || "未命名供应商"} / {imageTestResult.model || "未填写模型"}
                    </p>
                    {imageTestResult.preview_url && (
                      <div className="mt-4 overflow-hidden rounded-3xl border border-emerald-200 bg-white p-2 dark:border-emerald-900/60 dark:bg-stone-900/60">
                        <div 
                          className="relative w-full overflow-hidden rounded-[1.25rem] bg-stone-100 dark:bg-stone-800"
                          style={{ aspectRatio: `${settings.image.width || 4} / ${settings.image.height || 3}` }}
                        >
                          <Image
                            src={`${API_BASE_URL}${imageTestResult.preview_url}`}
                            alt="图片供应商测试结果"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}