import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerController } from "@/lib/watchTogether";
import { type SkipSegment } from "@/services/skip";

export interface UseAutoSkipOptions {
  enabled: boolean;
  segments: SkipSegment[];
  getPlayer?: () => PlayerController | null;
  pollIntervalMs?: number;
  onSkipped?: (seg: SkipSegment) => void;
}

export interface UseAutoSkipController {
  activeSegment: SkipSegment | null;
  skipNow: () => void;
}

const SKIP_COOLDOWN_MS = 1000;

export function useAutoSkip(options: UseAutoSkipOptions): UseAutoSkipController {
  const { enabled, segments, getPlayer, pollIntervalMs = 250, onSkipped } = options;

  const [activeSegment, setActiveSegment] = useState<SkipSegment | null>(null);
  const activeSegmentRef = useRef<SkipSegment | null>(null);
  activeSegmentRef.current = activeSegment;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;
  const getPlayerRef = useRef(getPlayer);
  getPlayerRef.current = getPlayer;
  const onSkippedRef = useRef(onSkipped);
  onSkippedRef.current = onSkipped;
  const pollMsRef = useRef(pollIntervalMs);
  pollMsRef.current = pollIntervalMs;

  const justSkippedRef = useRef(0);
  const skippedKeysRef = useRef<Set<string>>(new Set());

  const skip = useCallback((seg: SkipSegment) => {
    const player = getPlayerRef.current?.();
    if (!player) return;
    const snap = player.getSnapshot();
    const end = snap.duration > 0 ? Math.min(seg.end, snap.duration) : seg.end;
    player.seekTo(end);
    justSkippedRef.current = performance.now();
    skippedKeysRef.current.add(`${seg.kind}:${Math.round(seg.start)}:${Math.round(seg.end)}`);
    setActiveSegment(null);
    onSkippedRef.current?.(seg);
  }, []);

  const skipNow = useCallback(() => {
    const seg = activeSegmentRef.current;
    if (seg) skip(seg);
  }, [skip]);

  useEffect(() => {
    let token = 0;
    let lastTick = -1;
    let lastShown: SkipSegment | null = null;

    const tick = () => {
      const player = getPlayerRef.current?.();
      const now = performance.now();
      if (player) {
        const snap = player.getSnapshot();
        if (snap.duration > 0) {
          const bucket = Math.floor(snap.currentTime * 4);
          if (bucket !== lastTick) {
            lastTick = bucket;
            const seg =
              segmentsRef.current.find(
                (s) => snap.currentTime >= s.start && snap.currentTime < s.end,
              ) ?? null;

            if (seg) {
              const key = `${seg.kind}:${Math.round(seg.start)}:${Math.round(seg.end)}`;
              const cooldown = now - justSkippedRef.current >= SKIP_COOLDOWN_MS;
              const auto = enabledRef.current && cooldown && !skippedKeysRef.current.has(key);
              if (auto) {
                skippedKeysRef.current.add(key);
                skip(seg);
              } else if (lastShown !== seg) {
                lastShown = seg;
                setActiveSegment(seg);
              }
            } else {
              lastShown = null;
              if (activeSegmentRef.current) setActiveSegment(null);
              skippedKeysRef.current.clear();
            }
          }
        }
      }
    };

    token = window.setTimeout(function loop() {
      tick();
      token = window.setTimeout(loop, pollMsRef.current);
    }, 0);

    return () => window.clearTimeout(token);
  }, [skip]);

  return { activeSegment, skipNow };
}