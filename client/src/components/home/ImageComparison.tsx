"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { PLACEHOLDERS } from "@/lib/constants";

interface ImageComparisonProps {
  beforeImage?: string;
  afterImage?: string;
}

export default function ImageComparison({ beforeImage, afterImage }: ImageComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayBefore = beforeImage || PLACEHOLDERS.OLD_PHOTO;
  const displayAfter = afterImage || PLACEHOLDERS.AI_RESTORED;

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - containerRect.left) / containerRect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const onMouseDown = () => {
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", handleMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const onTouchStart = () => {
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", onTouchEnd);
  };

  const onTouchEnd = () => {
    window.removeEventListener("touchmove", handleMove);
    window.removeEventListener("touchend", onTouchEnd);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-col-resize select-none border-4 border-white shadow-2xl"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Before Image */}
      <div className="absolute inset-0">
        <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">原始记录</div>
        <Image 
          src={displayBefore} 
          alt="Original" 
          fill 
          sizes="(max-width: 1024px) 100vw, 66vw"
          quality={92}
          className="object-cover"
        />
      </div>

      {/* After Image */}
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ width: `${sliderPosition}%` }}
      >
        <div className="absolute top-4 right-4 z-10 bg-stone-900/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">AI 修复重构</div>
        <div className="w-[100vw] h-full relative">
            <Image 
                src={displayAfter} 
                alt="AI Restored" 
                fill 
              sizes="(max-width: 1024px) 100vw, 66vw"
              quality={92}
                className="object-cover"
            />
        </div>
      </div>

      {/* Slider Bar */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-stone-300 rounded-full"></div>
            <div className="w-1 h-3 bg-stone-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
