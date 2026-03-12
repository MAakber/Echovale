"use client";

import { useState } from "react";
import Image from "next/image";
import { PLACEHOLDERS } from "@/lib/constants";

interface ImageComparisonProps {
  beforeImage?: string;
  afterImage?: string;
}

export default function ImageComparison({ afterImage }: ImageComparisonProps) {
  const [opened, setOpened] = useState(false);

  const displayAfter = afterImage || PLACEHOLDERS.AI_RESTORED;

  return (
    <div className={`relative overflow-hidden rounded-[2rem] shadow-[0_28px_80px_rgba(89,118,162,0.18)] transition-all duration-700 dark:bg-[#1b2230] ${opened ? "bg-transparent" : "border border-[#cfdaee] bg-[#eef4fb] dark:border-[#667b9d]"}`}>

      <div className="relative aspect-[4/3] overflow-hidden px-5 py-5 sm:px-8 sm:py-8">
        <div className={`absolute inset-4 transition-opacity duration-500 sm:inset-6 ${opened ? "pointer-events-none opacity-0" : "opacity-100"}`}>
          <div className="absolute inset-[3%]">
            <div className="absolute inset-0 rounded-[1.8rem] bg-[linear-gradient(180deg,#d7e7fb_0%,#a9c5eb_100%)] shadow-[0_20px_34px_rgba(89,118,162,0.18),inset_0_1px_0_rgba(255,255,255,0.78)] dark:bg-[linear-gradient(180deg,#5a6f92_0%,#465776_100%)]" />
            <div className="absolute inset-0 rounded-[1.8rem] opacity-30 mix-blend-soft-light [background-image:radial-gradient(rgba(255,255,255,0.4)_0.8px,transparent_0.8px)] [background-size:8px_8px] dark:opacity-10" />

            <div className="absolute left-[7%] top-[22%] z-0 h-[13%] w-[43%] rounded-[0.4rem] bg-[#f9fbff] shadow-[0_2px_8px_rgba(106,128,162,0.06)] dark:bg-[#e2e9f4]" />
            <div className="absolute right-[7%] top-[22%] z-0 h-[13%] w-[43%] rounded-[0.4rem] bg-[#f9fbff] shadow-[0_2px_8px_rgba(106,128,162,0.06)] dark:bg-[#e2e9f4]" />

            <div className="absolute left-[4%] top-[7%] z-10 h-[38%] w-[40%] [clip-path:polygon(0_0,100%_0,70%_100%)] bg-[linear-gradient(135deg,#b9d2f4_0%,#8db3e6_100%)] shadow-[1px_3px_8px_rgba(89,118,162,0.1)] dark:bg-[linear-gradient(135deg,#607ca4_0%,#4d668a_100%)]" />
            <div className="absolute right-[4%] top-[7%] z-10 h-[38%] w-[40%] [clip-path:polygon(0_0,100%_0,30%_100%)] bg-[linear-gradient(225deg,#b9d2f4_0%,#8db3e6_100%)] shadow-[-1px_3px_8px_rgba(89,118,162,0.1)] dark:bg-[linear-gradient(225deg,#607ca4_0%,#4d668a_100%)]" />
            <div className="absolute left-[4%] top-[43%] z-10 h-[50%] w-[92%] rounded-b-[1.7rem] bg-[linear-gradient(180deg,#8db4ea_0%,#6f98d7_100%)] shadow-[0_-4px_16px_rgba(89,118,162,0.12)] dark:bg-[linear-gradient(180deg,#59759c_0%,#476180_100%)]" />
            <div className="absolute left-[4%] top-[43%] z-20 h-[50%] w-[92%] [clip-path:polygon(0_0,50%_60%,100%_0,100%_100%,0_100%)] rounded-b-[1.7rem] bg-[linear-gradient(180deg,#b8d2f5_0%,#93b5e6_100%)]" />

            <div className="absolute inset-x-[12%] top-[7%] z-30 h-[50%] [clip-path:polygon(0_0,100%_0,50%_88%)] bg-[linear-gradient(180deg,#c8dcf7_0%,#9ec0eb_100%)] shadow-[0_12px_18px_rgba(89,118,162,0.12)] dark:bg-[linear-gradient(180deg,#607ca4_0%,#4d668a_100%)]" />
            <div className="absolute inset-x-[12%] top-[7%] z-30 h-[50%] opacity-18 mix-blend-screen [clip-path:polygon(0_0,100%_0,50%_88%)] bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0))]" />

            <div className="absolute left-1/2 top-[56%] z-40 -translate-x-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={() => setOpened(true)}
              className="group relative h-24 w-24 cursor-pointer rounded-full transition-transform duration-300 hover:scale-105 focus:outline-none"
              aria-label="查看乡村记忆"
            >
              <span className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#9bb8e2] shadow-[0_6px_14px_rgba(89,118,162,0.18)] dark:bg-[#6f8bb4]" />
              <span className="absolute left-1/2 top-1/2 h-20 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(180deg,#d7e7fb_0%,#a8c5eb_100%)] shadow-[0_3px_8px_rgba(89,118,162,0.16)] group-hover:brightness-105 dark:bg-[linear-gradient(180deg,#8cadde_0%,#6e92c8_100%)]" />
              <span className="absolute left-1/2 top-1/2 h-20 w-7 -translate-x-1/2 -translate-y-1/2 rotate-[60deg] rounded-full bg-[linear-gradient(180deg,#d7e7fb_0%,#a8c5eb_100%)] shadow-[0_3px_8px_rgba(89,118,162,0.16)] group-hover:brightness-105 dark:bg-[linear-gradient(180deg,#8cadde_0%,#6e92c8_100%)]" />
              <span className="absolute left-1/2 top-1/2 h-20 w-7 -translate-x-1/2 -translate-y-1/2 rotate-[120deg] rounded-full bg-[linear-gradient(180deg,#d7e7fb_0%,#a8c5eb_100%)] shadow-[0_3px_8px_rgba(89,118,162,0.16)] group-hover:brightness-105 dark:bg-[linear-gradient(180deg,#8cadde_0%,#6e92c8_100%)]" />
              <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 bg-[#fffdf8] shadow-[0_2px_8px_rgba(89,118,162,0.14)] dark:border-white/20 dark:bg-[#eaf0f8]" />
              <span className="sr-only">点击花朵打开信封</span>
            </button>
          </div>
          </div>
        </div>

        <div className={`pointer-events-none absolute inset-0 z-20 flex items-end justify-center px-8 pb-10 transition-opacity duration-500 ${opened ? "opacity-0" : "opacity-100"}`}>
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]" />
        </div>

        <div className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${opened ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
          <div className="relative h-full overflow-hidden rounded-[2rem]">
            <Image
              src={displayAfter}
              alt="乡村记忆修复图"
              fill
              sizes="100vw"
              quality={100}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
