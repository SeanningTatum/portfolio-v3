import { useEffect, useRef, useState } from "react";
import { IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { setSoundEnabled } from "@/lib/console-sound";
import { cn } from "@/lib/utils";

/**
 * Ambient sound toggle for the home console — SF Mono utility control in the
 * corner-label family. Audio only ever starts from a user gesture (browser
 * autoplay policy), starts OFF on every visit, loops the calm ambient track
 * at low volume, and stops on unmount (leaving the page ends the ambience).
 * The label text is a design token (untranslated, like the corner labels).
 */
export function SoundToggle({ className }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      setSoundEnabled(false);
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      const audio = new Audio("/audio/ambient.mp3");
      audio.loop = true;
      audio.volume = 0.3;
      audioRef.current = audio;
    }
    if (playing) {
      audioRef.current.pause();
      setSoundEnabled(false);
      setPlaying(false);
    } else {
      // play() returns a promise; if the browser refuses, stay OFF.
      // The synth SFX (key clacks, laser zap) ride the same switch — this
      // click is the user gesture that unlocks the AudioContext.
      audioRef.current
        .play()
        .then(() => {
          setSoundEnabled(true);
          setPlaying(true);
        })
        .catch(() => {
          setSoundEnabled(false);
          setPlaying(false);
        });
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      data-testid="sound-toggle"
      aria-pressed={playing}
      aria-label={playing ? "Turn ambient sound off" : "Turn ambient sound on"}
      className={cn(
        "flex items-center gap-1.5 font-mono text-[10px] font-extrabold tracking-[0.2em] uppercase transition-colors",
        playing ? "text-pure-white" : "text-white/40 hover:text-white/70",
        className
      )}
    >
      {playing ? (
        <IconVolume className="size-3.5" aria-hidden />
      ) : (
        <IconVolumeOff className="size-3.5" aria-hidden />
      )}
      {playing ? "sound — on" : "sound — off"}
    </button>
  );
}
