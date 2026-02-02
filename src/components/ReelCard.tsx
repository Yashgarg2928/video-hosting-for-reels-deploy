import { useEffect, useRef, useState, useCallback } from "react";
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
  const [showPlayIcon, setShowPlayIcon] = useState(true); // Always show initially on iOS

  // Handle video ready state
  const handleCanPlayThrough = useCallback(() => {
    console.log("Video can play through");
  }, []);

  const handleLoadedData = useCallback(() => {
    console.log("Video loaded data");
  }, []);

  // Attempt to play video with iOS fallbacks
  const attemptPlay = useCallback(async (videoEl: HTMLVideoElement) => {
    try {
      // Ensure video is muted for autoplay (iOS requirement)
      videoEl.muted = true;

      // Load the video first (important for iOS)
      if (videoEl.readyState < 3) {
        videoEl.load();
        await new Promise<void>((resolve) => {
          const onCanPlay = () => {
            videoEl.removeEventListener('canplaythrough', onCanPlay);
            resolve();
          };
          videoEl.addEventListener('canplaythrough', onCanPlay);
          // Timeout fallback
          setTimeout(resolve, 3000);
        });
      }

      await videoEl.play();
      setIsPlaying(true);
      setShowPlayIcon(false);

      // If parent state says unmuted, try to unmute after play starts
      if (!isMuted) {
        videoEl.muted = false;
      }
    } catch (error: any) {
      console.error("Autoplay failed:", error);
      setShowPlayIcon(true);
      setIsPlaying(false);
    }
  }, [isMuted]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isActive) {
      attemptPlay(videoEl);
    } else {
      videoEl.pause();
      videoEl.currentTime = 0;
      setIsPlaying(false);
      setShowPlayIcon(true);
    }
  }, [isActive, attemptPlay]);

  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, isPlaying]);

  const togglePlay = async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isPlaying) {
      videoEl.pause();
      setIsPlaying(false);
      setShowPlayIcon(true);
    } else {
      try {
        // For user-initiated play, we can try unmuted
        videoEl.muted = isMuted;
        await videoEl.play();
        setIsPlaying(true);
        setShowPlayIcon(false);
      } catch (error) {
        console.error("Play failed:", error);
        // Fallback to muted play
        try {
          videoEl.muted = true;
          await videoEl.play();
          setIsPlaying(true);
          setShowPlayIcon(false);
          if (!isMuted) onToggleMute(); // Sync state
        } catch (e) {
          console.error("Play failed even muted:", e);
        }
      }
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
      {/* Video - iOS compatible attributes */}
      <video
        ref={videoRef}
        src={video.url}
        className="absolute inset-0 h-full w-full object-contain"
        loop
        playsInline
        autoPlay
        muted
        preload="auto"
        poster={posterUrl}
        onTimeUpdate={handleTimeUpdate}
        onCanPlayThrough={handleCanPlayThrough}
        onLoadedData={handleLoadedData}
        // @ts-ignore - webkit prefix for older iOS
        webkit-playsinline="true"
        // @ts-ignore - x5 for Android WebView
        x5-playsinline="true"
        x5-video-player-type="h5"
      />

      {/* Transparent tap overlay for play/pause - always present */}
      <div
        className="absolute inset-0 z-20 cursor-pointer"
        onClick={togglePlay}
      />

      {/* Play Icon Overlay */}
      {showPlayIcon && !isPlaying && isActive && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 pointer-events-none"
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

      {/* Debug Overlay */}
      <div className="absolute top-16 left-4 bg-black/50 text-white text-[10px] p-1 z-50 pointer-events-none">
        Status: {isPlaying ? "Playing" : "Paused"} | Muted: {isMuted ? "Yes" : "No"}
      </div>
    </div>
  );
}
