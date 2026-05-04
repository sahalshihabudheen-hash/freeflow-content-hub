
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Loader2, SkipForward, SkipBack } from "lucide-react";

interface Props {
  url: string;
  onEnded?: () => void;
  title?: string;
}

declare global {
  interface Window {
    Hls: any;
  }
}

export function AnimePlayer({ url, onEnded, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeout = useRef<any>(null);

  useEffect(() => {
    // Load HLS.js from CDN
    if (!window.Hls) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.async = true;
      script.onload = initPlayer;
      document.body.appendChild(script);
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (!videoRef.current || !url) return;
      const video = videoRef.current;

      if (window.Hls && window.Hls.isSupported() && url.endsWith(".m3u8")) {
        const hls = new window.Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          // video.play().catch(() => {});
        });
      } else {
        video.src = url;
      }
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.src = "";
      }
    };
  }, [url]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setVolume(val);
      setMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      className="relative group w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setLoading(true)}
        onPlaying={() => { setLoading(false); setPlaying(true); }}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        playsInline
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      )}

      {/* Big Play Button Overlay when paused */}
      {!playing && !loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="h-20 w-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl scale-110 transition-transform hover:scale-125">
            <Play className="h-10 w-10 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="relative group/progress mb-4 h-1.5 flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary relative" 
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {muted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/volume:w-20 transition-all duration-300 accent-primary"
              />
            </div>

            <div className="text-sm font-medium text-white tabular-nums">
              {formatTime(currentTime)} <span className="opacity-50">/ {formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex-1 text-center truncate px-4 hidden md:block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">{title}</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-white hover:text-primary transition-colors">
              <Settings size={20} />
            </button>
            <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
              <Maximize size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
