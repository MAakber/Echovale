"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ImageComparison from "@/components/home/ImageComparison";
import Link from "next/link";
import { motion } from "framer-motion";
import { PLACEHOLDERS } from "@/lib/constants";

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
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-50 transition-colors duration-300">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden lg:pt-48 lg:pb-32">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                className="flex-1 text-center lg:text-left"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-stone-600 dark:text-stone-400 uppercase bg-stone-200/50 dark:bg-stone-800/50 rounded-full">
                  AI 赋能 · 文化传承
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
                  乡村文化<br />
                  <span className="text-stone-500 dark:text-stone-400">记忆库</span>
                </h1>
                <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 mb-12 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                  基于 AIGC 技术，为每一座乡村构建独特的数字记忆，让悠远的乡愁在数字化浪潮中永垂不朽。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/create" className="px-10 py-4 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 rounded-full font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all">
                    开始构建记忆
                  </Link>
                  <Link href="/memories" className="px-10 py-4 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-50 border border-stone-200 dark:border-stone-800 rounded-full font-semibold text-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-all">
                    探索数字长廊
                  </Link>
                </div>
              </motion.div>

              <motion.div 
                className="flex-1 w-full max-w-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <ImageComparison 
                   beforeImage={PLACEHOLDERS.OLD_PHOTO}
                   afterImage={PLACEHOLDERS.AI_RESTORED}
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 bg-white dark:bg-stone-900/50">
          <div className="container mx-auto px-6 text-center">
            <motion.h2 
              className="text-3xl md:text-5xl font-bold mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              守护记忆，AI 的无限可能
            </motion.h2>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-12"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                { icon: "✍️", title: "文学化叙事", desc: "DeepSeek 深度理解口语碎片，将其重构为优美、动人的乡村文学篇章。" },
                { icon: "🎨", title: "影像重构", desc: "通过通义万相和文心一格，对破损老照片进行上色与高清修复。" },
                { icon: "🗺️", title: "时空地图", desc: "在交互式地图上标记乡村坐标，沿时间轴回溯文化的生长轨迹。" }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={fadeInUp}
                  className="group p-10 bg-stone-50 dark:bg-stone-800/50 rounded-3xl transition-all hover:shadow-2xl hover:-translate-y-2"
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

        {/* Call to Action */}
        <section className="py-24 bg-stone-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-stone-800 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-8">让乡愁不再是褪色的照片</h2>
              <p className="text-xl text-stone-400 mb-12 max-w-3xl mx-auto">
                每一处乡村都有不为人知的故事。现在就开始记录，用 AI 为你的家乡留下永恒的数字档案。
              </p>
              <Link href="/create" className="inline-block px-12 py-5 bg-white text-stone-950 rounded-full font-bold text-lg hover:bg-stone-100 transition-all shadow-xl">
                立即创建你的乡村笔记
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


