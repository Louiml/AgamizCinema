import { useEffect, useRef } from "react";
import { isTauri } from "@/services/tauri";
import type { PlayerController } from "@/lib/watchTogether";

export type MediaAction = "toggle-play" | "next" | "previous";

export interface UseGlobalMediaControlsOptions {
  getPlayer?: () => PlayerController | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onTogglePlay?: (player: PlayerController) => void;
}

export function useGlobalMediaControls(options: UseGlobalMediaControlsOptions = {}): void {
  const { getPlayer, onNext, onPrevious, onTogglePlay } = options;

  const getPlayerRef = useRef(getPlayer);
  getPlayerRef.current = getPlayer;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const onPreviousRef = useRef(onPrevious);
  onPreviousRef.current = onPrevious;
  const onTogglePlayRef = useRef(onTogglePlay);
  onTogglePlayRef.current = onTogglePlay;

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const handle = (action: string) => {
      switch (action) {
        case "next":
          onNextRef.current?.();
          break;
        case "previous":
          onPreviousRef.current?.();
          break;
        case "toggle-play": {
          const player = getPlayerRef.current?.();
          if (!player) break;
          if (onTogglePlayRef.current) {
            onTogglePlayRef.current(player);
          } else {
            const snap = player.getSnapshot();
            if (snap.playing) player.pause();
            else player.play();
          }
          break;
        }
      }
    };

    if (isTauri()) {
      let disposed = false;
      import("@tauri-apps/api/event")
        .then(({ listen }) =>
          listen<MediaAction>("window://media", (event) => handle(event.payload)),
        )
        .then((un) => {
          if (disposed) un();
          else unlisten = un;
        })
        .catch(() => undefined);
      return () => {
        disposed = true;
        unlisten?.();
      };
    }

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case 179:
          handle("toggle-play");
          break;
        case 176:
          handle("next");
          break;
        case 177:
          handle("previous");
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}