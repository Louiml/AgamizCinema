/**
 * Serverless "Watch Together" protocol & helpers.
 *
 * Transport: WebRTC DataChannels established with `peerjs` and its *free*
 * public Cloudflare-hosted signaling server (`0.peerjs.com`). Signaling is only
 * used for the WebRTC handshake (SDP + ICE) - after that all playback state
 * travels over an end-to-end encrypted, low-latency DataChannel. No custom
 * backend is ever deployed.
 *
 * Topology: a star, with the *host* (room creator) as the leader. The host is
 * authoritative for playback; guests only apply the host's commands. Guests
 * never re-broadcast host commands, which structurally prevents play/pause
 * "ping-pong" loops. Guests send periodic PINGs so the host can measure
 * round-trip time; the host answers with a PONG carrying its own high-res
 * clock so each guest can compute a running clock offset used for latency
 * compensation (see `useWatchTogether`).
 *
 * Every message is tagged `__watch: true` and validated with `isSyncMessage`.
 */

export const SYNC_TOLERANCE_SECONDS = 1.5;
export const HEARTBEAT_MS = 5000;

/** A minimal control surface the hook uses to drive playback. */
export interface PlayerController {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  getSnapshot(): PlayerSnapshot;
}

export interface PlayerSnapshot {
  playing: boolean;
  currentTime: number;
  duration: number; 
}

export function createVideoPlayerController(video: HTMLVideoElement): PlayerController {
  return {
    play: () => {
      if (video.paused) void video.play().catch(() => undefined);
    },
    pause: () => video.pause(),
    seekTo: (seconds: number) => {
      video.currentTime = Math.max(0, seconds);
    },
    getSnapshot: () => ({
      playing: !video.paused && !video.ended,
      currentTime: video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
    }),
  };
}


export type WatchMessage =
  | { __watch: true; type: "PLAY"; ts: number; time: number }
  | { __watch: true; type: "PAUSE"; ts: number; time: number }
  | { __watch: true; type: "SEEK"; ts: number; time: number }
  | { __watch: true; type: "PING"; ts: number }
  | { __watch: true; type: "PONG"; ts: number; hostTime: number }
  | {
      __watch: true;
      type: "STATUS";
      ts: number;
      mediaId: string | null;
      peers: number;
    };

export type WatchCommand = Extract<WatchMessage, { type: "PLAY" | "PAUSE" | "SEEK" }>;

const WATCH_TYPES = ["PLAY", "PAUSE", "SEEK", "PING", "PONG", "STATUS"] as const;

export function isWatchMessage(value: unknown): value is WatchMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { __watch?: unknown; type?: unknown };
  return (
    v.__watch === true &&
    typeof v.type === "string" &&
    (WATCH_TYPES as readonly string[]).includes(v.type)
  );
}

/** Builds a room-level message for the given peer. */
export function buildMessage(
  type: WatchMessage["type"],
  fields: Record<string, unknown> = {},
): WatchMessage {
  return { __watch: true, type, ts: performance.now(), ...fields } as unknown as WatchMessage;
}

const ROOM_ID_REGEX = /^agamiz-watch-[A-Za-z0-9]{20,64}$/;

/** Generates a collision-resistant peer id that doubles as the room id. */
export function createRoomId(): string {
  const token = crypto.randomUUID().replace(/-/g, "").toLowerCase();
  return `agamiz-watch-${token}`;
}

/** True if the string looks like a valid room id (not a full URL). */
export function isRoomId(value: string): boolean {
  return ROOM_ID_REGEX.test(value.trim());
}

/** Builds a shareable deep-link (room code embedded in the app's hash route). */
export function roomLink(roomId: string): string {
  return `${location.origin}${location.pathname}#/watch?room=${encodeURIComponent(roomId)}`;
}

let pendingRoomId: string | null = null;

export function setPendingRoom(value: string | null | undefined): void {
  pendingRoomId = value && isRoomId(value) ? value : null;
}

export function peekPendingRoom(): string | null {
  return pendingRoomId;
}

export function consumePendingRoom(): string | null {
  const id = pendingRoomId;
  pendingRoomId = null;
  return id;
}

export function parseRoomLink(input: string): string | null {
  const trimmed = input.trim();
  if (isRoomId(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const match = url.hash.match(/[?&]room=([^&#]+)/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      if (isRoomId(id)) return id;
    }
  } catch {
  }
  return null;
}