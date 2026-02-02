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
  const posterUrl = video.url.replace(/\.mp4$/, ".jpg");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [debugInfo, setDebugInfo] = useState("Init");

  // Detect iOS devices
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  // Simple play function
  const playVideo = async () => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      setDebugInfo("No video element");
      return;
    }

    setDebugInfo("Attempting play...");

    try {
      // Always ensure muted for autoplay
      videoEl.muted = true;

      const playPromise = videoEl.play();

      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setShowPlayButton(false);
        setDebugInfo("Playing!");

        // Try to unmute after successful play if needed
        if (!isMuted) {
          videoEl.muted = false;
        }
      }
    } catch (error: any) {
      console.error("Play error:", error);
      setDebugInfo("Tap to play");
      setShowPlayButton(true);
      setIsPlaying(false);
    }
  };

  const pauseVideo = () => {
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.pause();
      setIsPlaying(false);
      setShowPlayButton(true);
      setDebugInfo("Paused");
    }
  };

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  };

  // Handle active state changes
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      // Only autoplay on non-iOS devices
      if (isIOS()) {
        setDebugInfo("Tap to play");
        setShowPlayButton(true);
      } else {
        // Autoplay on other devices (Android, Desktop)
        const timer = setTimeout(() => {
          playVideo();
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      videoEl.pause();
      videoEl.currentTime = 0;
      setIsPlaying(false);
      setShowPlayButton(true);
    }
  }, [isActive]);

  // Handle mute changes
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && isPlaying) {
      videoEl.muted = isMuted;
    }
  }, [isMuted, isPlaying]);

  const handleTimeUpdate = () => {
    const videoEl = videoRef.current;
    if (videoEl && videoEl.duration) {
      setProgress((videoEl.currentTime / videoEl.duration) * 100);
    }
  };

  // Video event handlers for debugging
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoEl = e.currentTarget;
    const error = videoEl.error;
    setDebugInfo(`Video Error: ${error?.code} - ${error?.message}`);
  };

  const handleLoadStart = () => setDebugInfo("Loading...");
  const handleCanPlay = () => setDebugInfo("Can Play");
  const handleWaiting = () => setDebugInfo("Buffering...");

  return (
    <div className="relative h-full w-full bg-black">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={video.url}
        className="absolute inset-0 h-full w-full object-contain"
        loop
        playsInline
        muted
        preload="auto"
        poster={posterUrl}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlay={() => { setIsPlaying(true); setShowPlayButton(false); setDebugInfo("Playing"); }}
        onPause={() => { setIsPlaying(false); setShowPlayButton(true); setDebugInfo("Paused"); }}
        // iOS-specific attributes
        {...{
          "webkit-playsinline": "true",
          "x5-playsinline": "true",
          "x5-video-player-type": "h5",
          "x5-video-player-fullscreen": "false"
        } as any}
      />

      {/* Tap overlay - using both onClick and onTouchEnd for broader compatibility */}
      <div
        className="absolute inset-0 z-20"
        onClick={handleTap}
        onTouchEnd={handleTap}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      />

      {/* Play Button Overlay */}
      {showPlayButton && isActive && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="rounded-full bg-black/50 p-6 backdrop-blur-sm">
            <PlayIcon className="h-20 w-20 text-white" />
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20 pointer-events-none">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mute/Unmute Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        onTouchEnd={(e) => { e.stopPropagation(); }}
        className={cn(
          "absolute bottom-6 right-4 z-40",
          "flex items-center justify-center",
          "h-12 w-12 rounded-full bg-black/50 backdrop-blur-sm",
          "active:bg-black/70"
        )}
      >
        {isMuted ? (
          <MuteIcon className="h-6 w-6 text-white" />
        ) : (
          <VolumeIcon className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-16 z-10 text-white pointer-events-none">
        <p className="font-bold text-lg drop-shadow-lg">@{video.username}</p>
        <p className="text-sm mt-1 line-clamp-2 drop-shadow-md opacity-90">{video.description}</p>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Debug Overlay - shows detailed info */}
      <div className="absolute top-16 left-4 bg-black/70 text-white text-xs p-2 z-50 pointer-events-none rounded max-w-[200px]">
        <div>Status: {debugInfo}</div>
        <div>Playing: {isPlaying ? "Yes" : "No"}</div>
        <div>Active: {isActive ? "Yes" : "No"}</div>
        <div>Muted: {isMuted ? "Yes" : "No"}</div>
      </div>
    </div>
  );
}
