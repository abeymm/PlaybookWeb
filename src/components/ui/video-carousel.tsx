"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoSlide {
  src: string;
  poster: string;
}

interface VideoCarouselProps {
  slides: VideoSlide[];
  title: string;
  features: string[];
  className?: string;
}

export function VideoCarousel({ slides, title, features, className }: VideoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-advance when video ends
  const handleVideoEnded = () => {
    const nextIndex = (activeIndex + 1) % slides.length;
    setActiveIndex(nextIndex);
  };

  // When active index changes, play the new video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, that's okay
      });
    }
  }, [activeIndex]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/50 bg-background", className)}>
      <div className="flex flex-col lg:flex-row">
        {/* Video Container */}
        <div className="flex justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-4 dark:from-gray-800 dark:via-gray-900 dark:to-gray-950 md:p-6 lg:flex-1">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="h-[350px] w-auto rounded-xl md:h-[450px] lg:h-[500px]"
            poster={slides[activeIndex].poster}
          >
            <source src={slides[activeIndex].src} type="video/mp4" />
          </video>
        </div>

        {/* Text Content - Side on desktop */}
        <div className="flex flex-col justify-center p-6 lg:w-[340px] lg:p-8">
          {/* Feature Text */}
          <Badge variant="secondary" className="mb-3 w-fit text-xs">
            Included Free
          </Badge>
          <h3 className="text-xl font-bold md:text-2xl">{title}</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
                {feature}
              </li>
            ))}
          </ul>

          {/* Dot Indicators */}
          <div className="mt-6 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-8 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
