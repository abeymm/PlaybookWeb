"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
  autoAnimate?: boolean;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  beforeAlt = "Before image",
  afterAlt = "After image",
  className,
  autoAnimate = true,
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width for proper image sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Auto-animate on first view: start at 0 (risky), animate to 100 (smart), then to 50 (center)
  useEffect(() => {
    if (!autoAnimate || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          setSliderPosition(0);

          // Animate to show "smart" (100%)
          setTimeout(() => {
            setSliderPosition(100);
          }, 400);

          // Animate to center (50%)
          setTimeout(() => {
            setSliderPosition(50);
          }, 1200);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [autoAnimate, hasAnimated]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    []
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  // Global mouse up listener to handle releasing outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Calculate label opacity based on slider position
  // "Before" image shows when slider is high (clipped area is large)
  // "After" image shows when slider is low (clipped area is small, revealing underneath)
  const beforeLabelOpacity = Math.max(0, Math.min(1, sliderPosition / 50));
  const afterLabelOpacity = Math.max(0, Math.min(1, (100 - sliderPosition) / 50));

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full cursor-ew-resize select-none overflow-hidden rounded-2xl",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* After image (full, underneath) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-contain"
          priority
          draggable={false}
        />
      </div>

      {/* Before image (clipped based on slider position) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <div
          className="relative h-full"
          style={{ width: containerWidth || "100%" }}
        >
          <Image
            src={beforeImage}
            alt={beforeAlt}
            fill
            className="object-contain"
            priority
            draggable={false}
          />
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 z-10 flex items-center"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        {/* Vertical line */}
        <div className="h-full w-0.5 bg-white shadow-lg" />

        {/* Circular handle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white/20 shadow-lg backdrop-blur-sm transition-transform hover:scale-110">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {/* Left chevron */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 5l-5 7 5 7"
              />
              {/* Right chevron */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 5l5 7-5 7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div
        className="absolute left-4 top-4 z-20 transition-opacity duration-300"
        style={{ opacity: beforeLabelOpacity }}
      >
        <span className="rounded-full bg-red-500/90 px-3 py-1 text-sm font-semibold text-white shadow-lg backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>
      <div
        className="absolute right-4 top-4 z-20 transition-opacity duration-300"
        style={{ opacity: afterLabelOpacity }}
      >
        <span className="rounded-full bg-green-500/90 px-3 py-1 text-sm font-semibold text-white shadow-lg backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}
