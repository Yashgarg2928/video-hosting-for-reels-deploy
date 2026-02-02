import { useState, useRef, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { ReelCard } from "./components/ReelCard";
import { fetchReelsData, Reel } from "./utils/csvLoader";

export function App() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReelsData()
      .then(data => {
        setReels(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load reels:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const newIndex = Math.round(scrollTop / height);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < reels.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, reels.length]);

  if (loading) {
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading Reels...</div>;
  }

  return (
    <>
      <div className="h-screen h-[100dvh] w-full bg-black overflow-hidden relative">
        {/* Reels Container - Full Screen */}
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide touch-pan-y"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {reels.map((reel, index) => (
            <div key={reel.id} className="h-full w-full snap-start snap-always">
              <ReelCard
                video={reel}
                isActive={index === activeIndex}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(!isMuted)}
              />
            </div>
          ))}
        </div>

        {/* Reel Indicators */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-1.5">
          {reels.map((_, index) => (
            <div
              key={index}
              className={`w-1 rounded-full transition-all ${index === activeIndex ? "h-5 bg-white" : "h-1.5 bg-white/40"
                }`}
            />
          ))}
        </div>
      </div>
      <Analytics />
    </>
  );
}
