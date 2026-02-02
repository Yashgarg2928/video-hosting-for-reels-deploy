import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { PlayIcon, VolumeIcon, MuteIcon } from "./Icons";

interface ReelCardProps {
  video: {
    id: number;
    url: string;
    username: string;
    description: string;
  };
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export function ReelCard({ video, isActive, isMuted, onToggleMute }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      // Promise handling for play()
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            // Check if the component is still active before attempting fallback
            if (!isActive) return;

            if (error.name === "AbortError") {
              // AbortError means the play request was interrupted (e.g., by pausing).
              // We should ignore this error as it's expected behavior during scrolling.
              return;
            }

            console.log("Autoplay failed with error:", error);
            setShowPlayIcon(true);

            // Handle browser autoplay policy prevention
            if (error.name === "NotAllowedError") {
              // Fallback: Mute and play.
              videoEl.muted = true;
              videoEl.play()
                .then(() => {
                  if (!isActive) {
                    videoEl.pause();
                    return;
                  }
                  setIsPlaying(true);
                  // Update state to reflect we are now muted
                  if (!isMuted) {
                    onToggleMute();
                  }
                })
                .catch((err) => {
                  console.error("Autoplay failed even with mute:", err);
                  setShowPlayIcon(true);
                });
            }
          });
      }
    } else {
      videoEl.pause();
      videoEl.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleFirstInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      // Unmute on first interaction
      if (isMuted) {
        onToggleMute();
      }
    }
  };

  const togglePlay = () => {
    handleFirstInteraction();
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isPlaying) {
      videoEl.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
    } else {
      videoEl.play().then(() => {
        setIsPlaying(true);
        setShowPlayIcon(false);
      }).catch(() => { });
    }
  };

  const handleTimeUpdate = () => {
    const videoEl = videoRef.current;
    if (videoEl && videoEl.duration) {
      setProgress((videoEl.currentTime / videoEl.duration) * 100);
    }
  };

  return (
    <div className="relative h-full w-full bg-black">
      {/* Video - Contained to show full video without cropping */}
      <video
        ref={videoRef}
        src={video.url}
        className="absolute inset-0 h-full w-full object-contain pointer-events-auto"
        loop
        playsInline
        preload="auto"
        muted={isMuted}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Play/Pause Overlay */}
      {showPlayIcon && !isPlaying && isActive && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/10"
          onClick={togglePlay}
        >
          <div className="rounded-full bg-black/40 p-5 backdrop-blur-sm">
            <PlayIcon className="h-16 w-16 text-white" />
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mute/Unmute Button */}
      <button
        onClick={onToggleMute}
        className={cn(
          "absolute bottom-6 right-4 z-20",
          "flex items-center justify-center",
          "h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm",
          "hover:bg-black/60 transition-colors"
        )}
      >
        {isMuted ? (
          <MuteIcon className="h-5 w-5 text-white" />
        ) : (
          <VolumeIcon className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Bottom Info - Username & Description */}
      <div className="absolute bottom-4 left-4 right-16 z-10 text-white pointer-events-none">
        <p className="font-bold text-lg drop-shadow-lg">@{video.username}</p>
        <p className="text-sm mt-1 line-clamp-2 drop-shadow-md opacity-90">{video.description}</p>
      </div>

      {/* Gradient Overlays for better text readability */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
}
