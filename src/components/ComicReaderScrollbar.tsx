import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ComicReaderScrollbarProps {
  totalPages: number;
}

export function ComicReaderScrollbar({ totalPages }: ComicReaderScrollbarProps) {
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show scrollbar when scrolling
  const handleScroll = useCallback(() => {
    if (isDragging) return;

    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? winScroll / height : 0;
    
    setProgress(scrolled);
    setIsVisible(true);

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (!isDragging) setIsVisible(false);
    }, 2000);
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setIsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    handlePointerMove(e);
  };

  const handlePointerMove = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const newProgress = y / rect.height;
    
    setProgress(newProgress);
    
    const targetScroll = newProgress * (document.documentElement.scrollHeight - document.documentElement.clientHeight);
    window.scrollTo({ top: targetScroll, behavior: "auto" });
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 2000);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const currentPage = Math.min(totalPages, Math.max(1, Math.round(progress * totalPages) || 1));

  if (totalPages <= 1) return null;

  return (
    <div 
      className={cn(
        "fixed right-1 top-1/2 -translate-y-1/2 h-[60vh] w-8 flex items-center justify-center z-[100] transition-all duration-500",
        isVisible || isDragging ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
      )}
      onPointerDown={handlePointerDown}
    >
      <div 
        ref={trackRef}
        className="relative w-1.5 h-full bg-secondary/40 backdrop-blur-sm rounded-full cursor-pointer group"
      >
        {/* Progress Fill */}
        <div 
          className="absolute top-0 left-0 w-full bg-primary/30 rounded-full transition-all duration-75"
          style={{ height: `${progress * 100}%` }}
        />

        {/* Thumb */}
        <div 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-12 bg-primary rounded-full shadow-lg shadow-primary/30 border-2 border-background transition-transform active:scale-110 flex items-center justify-center",
            isDragging ? "scale-110" : "scale-100"
          )}
          style={{ top: `${progress * 100}%` }}
        >
          <div className="w-0.5 h-4 bg-primary-foreground/40 rounded-full" />
        </div>

        {/* Indicator */}
        <div 
          className={cn(
            "absolute right-8 -translate-y-1/2 px-3 py-1.5 glass rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 pointer-events-none flex flex-col items-center gap-0.5",
            isDragging ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-90 translate-x-2"
          )}
          style={{ top: `${progress * 100}%` }}
        >
          <span className="text-muted-foreground leading-none">Page</span>
          <span className="text-primary text-sm leading-none">{currentPage} <span className="text-muted-foreground/40 text-[10px]">/ {totalPages}</span></span>
        </div>
      </div>
    </div>
  );
}
