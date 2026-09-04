import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Users, LinkIcon, Copy, LogOut, UsersRound, CircleAlert, Loader2, Play, Pause } from "lucide-react";
import { useWatchTogether, type WatchPhase } from "@/hooks/useWatchTogether";
import { createVideoPlayerController, consumePendingRoom, roomLink, type PlayerController } from "@/lib/watchTogether";
import { toast } from "@/lib/toast";

interface WatchTogetherPanelProps {
  mediaKey?: string;
  video?: HTMLVideoElement | null;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WatchTogetherPanel({
  mediaKey,
  video,
  iframeRef,
  open: openProp,
  onOpenChange,
}: WatchTogetherPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };
  const { t } = useTranslation();
  const [joinInput, setJoinInput] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  const watch = useWatchTogether({
    mediaId: mediaKey ?? null,
    getVideo: () => video ?? null,
    getPlayer: () => buildController(video, iframeRef),
    onCommand: (command) => {
      iframeRef?.current?.contentWindow?.postMessage({ ...command }, "*");
    },
    debug: false,
  });

  const autoJoinStarted = useRef(false);
  useEffect(() => {
    if (autoJoinStarted.current) return;
    const pending = consumePendingRoom();
    if (!pending) return;
    autoJoinStarted.current = true;
    setOpen(true);
    toast({ message: t("toasts.joiningRoom") });
    void watch.joinRoom(pending).then(() =>
      toast({ message: t("toasts.roomJoined"), tone: "success" }),
    );
  }, [watch, t]);

  const emitRef = useRef(watch.emit);
  emitRef.current = watch.emit;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data as { __watch?: boolean; type?: string };
      if (!msg || msg.__watch !== true) return;
      if (msg.type === "PLAY" || msg.type === "PAUSE" || msg.type === "SEEK") {
        emitRef.current(msg.type);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const handleCopy = async () => {
    if (!watch.roomId) return;
    try {
      await navigator.clipboard.writeText(roomLink(watch.roomId));
      setCopied(true);
      toast({ message: t("toasts.linkCopied"), tone: "success" });
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const handleTransport = (type: "PLAY" | "PAUSE") => {
    const controller = buildController(video, iframeRef);
    if (controller) {
      if (type === "PLAY") controller.play();
      else controller.pause();
    }
    watch.emit(type);
    toast({ message: t("player.synced") });
  };

  const statusLabel = describeStatus(watch.status, t);

  return (
    <div className="glass-panel rounded-2xl p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="btn-glass flex items-center gap-2 text-sm"
        >
          <Users className="h-4 w-4 text-mint-400" />
          {t("watchTogether.title")}
        </button>
        {watch.status.phase === "ready" && (
          <span className="flex items-center gap-1.5 text-xs text-mint-300">
            <UsersRound className="h-3.5 w-3.5" />
            {t("watchTogether.peers", { count: watch.peers })}
          </span>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-white/[0.06] pt-3">
          {/* Status */}
          <div className="flex items-center justify-between gap-2 text-xs text-ash">
            <span className="flex items-center gap-2">
              {watch.status.phase === "ready" && <span className="h-2 w-2 rounded-full bg-mint-400" />}
              {statusLabel}
            </span>
            {watch.status.phase === "reconnecting" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {watch.status.phase === "error" && <CircleAlert className="h-3.5 w-3.5 text-rose-300" />}
          </div>

          {/* Room code + copy */}
          {watch.roomId && (
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-ink-deep/60 px-2.5 py-1.5 font-mono text-[11px] text-mint-200">
                {watch.roomId}
              </code>
              <button type="button" onClick={handleCopy} className="btn-icon h-8 w-8" title={t("watchTogether.copyInvite")}>
                {copied ? <Copy className="h-4 w-4 text-mint-300" /> : <LinkIcon className="h-4 w-4" />}
              </button>
            </div>
          )}

          {/* Host transport controls */}
          {watch.status.phase === "ready" && watch.isHost && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleTransport("PLAY")} className="btn-glass flex flex-1 items-center justify-center gap-2 text-sm">
                <Play className="h-4 w-4" /> {t("watchTogether.playAll")}
              </button>
              <button type="button" onClick={() => handleTransport("PAUSE")} className="btn-glass flex flex-1 items-center justify-center gap-2 text-sm">
                <Pause className="h-4 w-4" /> {t("watchTogether.pauseAll")}
              </button>
            </div>
          )}

          {/* Idle / create or join */}
          {watch.status.phase === "idle" && (
            <>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => watch.createRoom().catch(() => undefined)} className="btn-glass flex-1 text-sm">
                  {t("watchTogether.createRoom")}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  placeholder={t("watchTogether.joinPlaceholder")}
                  aria-label={t("watchTogether.joinLabel")}
                  className="input-glass !py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    void watch.joinRoom(joinInput);
                    setJoinInput("");
                  }}
                  disabled={!joinInput.trim()}
                  className="btn-glass text-sm disabled:opacity-40"
                >
                  {t("watchTogether.join")}
                </button>
              </div>
            </>
          )}

          {/* Leave */}
          {watch.status.phase === "ready" && (
            <button type="button" onClick={watch.leaveRoom} className="btn-glass flex w-full items-center justify-center gap-2 text-sm">
              <LogOut className="h-4 w-4" /> {t("watchTogether.leave")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function buildController(
  video: HTMLVideoElement | null | undefined,
  iframeRef?: RefObject<HTMLIFrameElement | null>,
): PlayerController | null {
  if (video) return createVideoPlayerController(video);
  const iframe = iframeRef?.current;
  if (!iframe?.contentWindow) return null;
  const send = (type: "PLAY" | "PAUSE" | "SEEK") =>
    iframe.contentWindow?.postMessage({ __watch: true, type }, "*");
  return {
    play: () => send("PLAY"),
    pause: () => send("PAUSE"),
    seekTo: () => send("SEEK"),
    getSnapshot: () => ({ playing: false, currentTime: 0, duration: 0 }),
  };
}

function describeStatus(status: WatchPhase, t: (key: string, opts?: Record<string, unknown>) => string): string {
  switch (status.phase) {
    case "idle":
      return t("watchTogether.statusIdle");
    case "creating":
      return t("watchTogether.statusCreating");
    case "connecting":
      return t("watchTogether.statusConnecting");
    case "ready":
      return status.role === "host"
        ? t("watchTogether.statusReadyHost")
        : t("watchTogether.statusReadyGuest");
    case "reconnecting":
      return t("watchTogether.statusReconnecting");
    case "error":
      return status.message || t("watchTogether.statusError");
  }
}