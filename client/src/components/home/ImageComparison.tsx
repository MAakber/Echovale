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
      className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm cursor-col-resize select-none dark:border-stone-800 dark:bg-stone-900"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Before Image */}
      <div className="absolute inset-0">
        <Image 
          src={displayBefore} 
          alt="Original" 
          fill 
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
          quality={100}
          className="object-cover"
        />
      </div>

      {/* After Image */}
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ width: `${sliderPosition}%` }}
      >
        <Image 
          src={displayAfter} 
          alt="AI Restored" 
          fill 
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
          quality={100}
          className="object-cover"
        />
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
