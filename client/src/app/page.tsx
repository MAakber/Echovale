"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import { PLACEHOLDERS } from "@/lib/constants";
import Image from "next/image";

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-stone-50 font-sans text-stone-900 transition-colors duration-300 dark:bg-stone-950 dark:text-stone-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.24),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_26%),radial-gradient(circle_at_50%_20%,_rgba(56,189,248,0.12),_transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.12),_transparent_24%),radial-gradient(circle_at_50%_20%,_rgba(56,189,248,0.1),_transparent_28%)]" />
      <Header />

      <main className="relative">
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
          <div className="container mx-auto px-6">
            <div className="mb-8 grid gap-6 rounded-[2rem] border border-stone-200/80 bg-white/88 p-6 shadow-[0_20px_80px_rgba(28,25,23,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/88 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-8">
              <motion.div 
                className="text-center lg:text-left"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block rounded-full bg-stone-200/60 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-stone-600 dark:bg-stone-800/60 dark:text-stone-300">
                  Rural Memory Studio
                </div>
                <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                  把乡村记忆
                  <br />
                  <span className="text-stone-500 dark:text-stone-400">做成能被继续观看的数字档案</span>
                </h1>
                <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-stone-600 dark:text-stone-400 lg:mx-0 md:text-2xl">
                  用统一的图文生成流程，整理老照片、口述片段与地方故事，让展示页、创作页和管理台使用同一套清晰的语言。
                </p>
                <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href="/create" className="rounded-full bg-stone-900 px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-stone-50 dark:text-stone-900">
                    开始构建记忆
                  </Link>
                  <Link href="/memories" className="rounded-full border border-stone-200 bg-white px-10 py-4 text-lg font-semibold text-stone-900 transition-all hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:hover:bg-stone-800">
                    探索数字长廊
                  </Link>
                </div>
              </motion.div>

              <motion.div 
                className="w-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="relative mx-auto aspect-[16/9] w-full max-w-3xl"
                >
                  <Image
                    src={PLACEHOLDERS.OLD_PHOTO}
                    alt="乡村记忆信件"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                    className="object-contain [clip-path:inset(0_0_0_7%)]"
                  />
                </motion.div>
              </motion.div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "创作流程", value: "统一图文生成" },
                { label: "适用场景", value: "村史、建筑、人物、民俗" },
                { label: "当前重点", value: "清晰录入与稳定展示" },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.15 }}
                  className="rounded-[1.5rem] border border-stone-200 bg-white/85 px-5 py-4 shadow-sm backdrop-blur dark:border-stone-800 dark:bg-stone-900/80"
                >
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold">{item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-6 text-center">
            <motion.h2 
              className="mb-5 text-3xl font-bold md:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              从录入、生成到管理，保持一套一致的工作流
            </motion.h2>
            <p className="mx-auto mb-16 max-w-3xl text-base leading-8 text-stone-500 dark:text-stone-400 md:text-lg">
              首页不再只讲概念，而是直接对应系统能力本身：文字整理、图像生成和地理展示，都服务于同一条乡村记忆生产线。
            </p>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                { icon: "✍️", title: "文字整理", desc: "把碎片化口述整理成可读、可保存、可继续编辑的乡村叙事。" },
                { icon: "🖼️", title: "统一出图", desc: "使用单一路径生成展示画面，减少模式切换和上游兼容性干扰。" },
                { icon: "🗺️", title: "地图归档", desc: "把地点和时间一起留下，让每条记忆都能落到真实空间与年代。" }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  className="group rounded-[2rem] border border-stone-200 bg-white/85 p-10 transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-stone-800 dark:bg-stone-900/80"
                >
                  <div className="w-16 h-16 bg-stone-900 dark:bg-stone-700 text-white rounded-2xl flex items-center justify-center text-2xl mb-8 mx-auto group-hover:rotate-12 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="relative overflow-hidden py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.16),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.12),_transparent_22%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.08),_transparent_22%)]"></div>
          <div className="container relative z-10 mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="rounded-[2rem] border border-stone-200/80 bg-white/88 px-6 py-16 text-center shadow-[0_20px_80px_rgba(28,25,23,0.08)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/88 md:px-10"
            >
              <h2 className="mb-8 text-4xl font-bold md:text-6xl">把一段乡村记忆，整理成可保存的数字档案</h2>
              <p className="mx-auto mb-12 max-w-3xl text-xl text-stone-500 dark:text-stone-400">
                上传图片、补充描述、生成图文草稿，再发布到数字长廊。每一次记录，都会成为可以继续查阅和传播的乡村记忆。
              </p>
              <Link href="/create" className="inline-block rounded-full bg-stone-900 px-12 py-5 text-lg font-bold text-white shadow-xl transition-all hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200">
                开始整理这段记忆
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


