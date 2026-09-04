import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Peer, { type DataConnection, type PeerJSOption } from "peerjs";
import {
  HEARTBEAT_MS,
  SYNC_TOLERANCE_SECONDS,
  buildMessage,
  createRoomId,
  isWatchMessage,
  parseRoomLink,
  type PlayerController,
  type WatchCommand,
  type WatchMessage,
} from "@/lib/watchTogether";

export type WatchPhase =
  | { phase: "idle" }
  | { phase: "creating" }
  | { phase: "connecting" }
  | { phase: "ready"; role: "host" | "guest" }
  | { phase: "reconnecting" }
  | { phase: "error"; message: string };

export interface UseWatchTogetherOptions {
  getPlayer?: () => PlayerController | null;
  getVideo?: () => HTMLVideoElement | null;
  mediaId?: string | null;
  onClockOffset?: (offsetMs: number) => void;
  onCommand?: (command: WatchCommand) => void;
  signalingHost?: string;
  debug?: boolean;
}

export interface UseWatchTogetherController {
  status: WatchPhase;
  roomId: string | null;
  peers: number;
  isHost: boolean;
  createRoom: () => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  emit: (type: "PLAY" | "PAUSE" | "SEEK") => void;
}

const RECONNECT_DELAY_MS = 1500;
const STALE_HOST_MS = 12_000;

export function useWatchTogether(options: UseWatchTogetherOptions = {}): UseWatchTogetherController {
  const {
    getPlayer,
    getVideo,
    mediaId = null,
    onClockOffset,
    onCommand,
    signalingHost = "0.peerjs.com",
    debug = false,
  } = options;

  const getPlayerRef = useRef(getPlayer);
  getPlayerRef.current = getPlayer;
  const getVideoRef = useRef(getVideo);
  getVideoRef.current = getVideo;
  const onClockOffsetRef = useRef(onClockOffset);
  onClockOffsetRef.current = onClockOffset;
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;
  const debugRef = useRef(debug);
  debugRef.current = debug;
  const mediaIdRef = useRef(mediaId);
  mediaIdRef.current = mediaId;

  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<Map<string, DataConnection>>(new Map());
  const roleRef = useRef<"host" | "guest" | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const clockOffsetRef = useRef(0);
  const lastActivityRef = useRef(performance.now());
  const destroyedRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const staleRef = useRef<number | null>(null);

  const [status, setStatus] = useState<WatchPhase>({ phase: "idle" });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [peers, setPeers] = useState(0);

  const log = useCallback((...args: unknown[]) => {
    if (debugRef.current) console.log("[watch-together]", ...args);
  }, []);

  const setPhase = useCallback((phase: WatchPhase) => {
    if (!destroyedRef.current) setStatus(phase);
  }, []);

  /**
   * Applies a command received from the host. For PLAY we estimate how much
   * wall-clock time has passed since the host created the command and project
   * the video forward by that amount (latency compensation). A tolerance band
   * avoids correcting harmless sub-second drift, which would look like jitter.
   */
  const applyCommand = useCallback((command: WatchCommand) => {
    onCommandRef.current?.(command);
    const player = getPlayerRef.current?.();
    if (!player) return;
    const elapsed = performance.now() + clockOffsetRef.current - command.ts;

    if (command.type === "PLAY") {
      const target = Math.max(0, command.time + elapsed);
      const snap = player.getSnapshot();
      if (Math.abs(target - snap.currentTime) > SYNC_TOLERANCE_SECONDS) {
        player.seekTo(snap.duration > 0 ? Math.min(target, snap.duration) : target);
      }
      if (!snap.playing) player.play();
    } else if (command.type === "PAUSE") {
      const snap = player.getSnapshot();
      if (snap.playing) player.pause();
      if (Math.abs(command.time - snap.currentTime) > SYNC_TOLERANCE_SECONDS) {
        player.seekTo(command.time);
      }
    } else {
      player.seekTo(command.time);
    }
    lastActivityRef.current = performance.now();
  }, []);

  const broadcast = useCallback((message: WatchMessage) => {
    for (const conn of connsRef.current.values()) {
      if (conn.open) {
        try {
          conn.send(message);
        } catch {
          /* peer already closed */
        }
      }
    }
  }, []);

  const sendStatus = useCallback(() => {
    broadcast(buildMessage("STATUS", { mediaId: mediaIdRef.current, peers: connsRef.current.size }));
  }, [broadcast]);

  const onData = useCallback(
    (raw: unknown) => {
      if (!isWatchMessage(raw)) return;
      const msg = raw;
      if (msg.type === "PING") {
        broadcast(buildMessage("PONG", { ts: msg.ts, hostTime: performance.now() }));
        return;
      }
      if (msg.type === "PONG") {
        const rtt = performance.now() - msg.ts;
        clockOffsetRef.current = msg.hostTime - (msg.ts + rtt / 2);
        onClockOffsetRef.current?.(clockOffsetRef.current);
        lastActivityRef.current = performance.now();
        return;
      }
      if (msg.type === "STATUS") {
        if (mediaIdRef.current && msg.mediaId && msg.mediaId !== mediaIdRef.current) {
          log("host is syncing a different title:", msg.mediaId);
        }
        setPeers(msg.peers);
        lastActivityRef.current = performance.now();
        return;
      }
      if (msg.type === "PLAY" || msg.type === "PAUSE" || msg.type === "SEEK") {
        if (roleRef.current === "guest") applyCommand(msg);
      }
    },
    [applyCommand, broadcast],
  );

  const wireConnection = useCallback(
    (conn: DataConnection) => {
      conn.on("open", () => {
        connsRef.current.set(conn.peer, conn);
        setPeers(connsRef.current.size);
        log("connection open:", conn.peer);
        if (roleRef.current === "host") sendStatus();
      });
      conn.on("data", (raw: unknown) => onData(raw));
      conn.on("close", () => {
        connsRef.current.delete(conn.peer);
        setPeers(connsRef.current.size);
        log("connection closed:", conn.peer);
      });
      conn.on("error", () => {
        connsRef.current.delete(conn.peer);
        setPeers(connsRef.current.size);
      });
    },
    [log, onData, sendStatus],
  );

  const handlePeerError = useCallback(
    (err: { type: string; message: string }) => {
      log("peer error:", err.type, err.message);
      lastActivityRef.current = performance.now();
      if (err.type === "peer-unavailable") {
        setPhase({ phase: "error", message: "Room not found." });
      } else if (err.type === "browser-incompatible") {
        setPhase({ phase: "error", message: "This browser does not support WebRTC." });
      } else if (
        err.type === "network" ||
        err.type === "server-error" ||
        err.type === "socket-error" ||
        err.type === "socket-closed"
      ) {
        setPhase({ phase: "reconnecting" });
      } else {
        setPhase({ phase: "error", message: err.message ?? "Connection failed." });
      }
    },
    [log, setPhase],
  );

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
    if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
    if (staleRef.current) window.clearInterval(staleRef.current);
    reconnectTimerRef.current = null;
    heartbeatRef.current = null;
    staleRef.current = null;
  }, []);

  const teardownPeer = useCallback(() => {
    clearTimers();
    for (const conn of connsRef.current.values()) conn.close();
    connsRef.current.clear();
    setPeers(0);
    peerRef.current?.destroy();
    peerRef.current = null;
  }, [clearTimers]);

  const leaveRoom = useCallback(() => {
    destroyedRef.current = true;
    teardownPeer();
    roleRef.current = null;
    roomIdRef.current = null;
    clockOffsetRef.current = 0;
    setRoomId(null);
    setPhase({ phase: "idle" });
  }, [setPhase, teardownPeer]);

  const startHostTimers = useCallback(() => {
    clearTimers();
    heartbeatRef.current = window.setInterval(sendStatus, HEARTBEAT_MS);
  }, [clearTimers, sendStatus]);

  const startGuestTimers = useCallback(() => {
    clearTimers();
    staleRef.current = window.setInterval(() => {
      if (performance.now() - lastActivityRef.current > STALE_HOST_MS) {
        setPhase({ phase: "reconnecting" });
      }
    }, HEARTBEAT_MS);
  }, [clearTimers, setPhase]);

  const createRoom = useCallback(async (): Promise<string> => {
    if (roleRef.current === "host" && peerRef.current && roomIdRef.current) {
      return roomIdRef.current;
    }
    leaveRoom();
    destroyedRef.current = false;
    setPhase({ phase: "creating" });

    const id = createRoomId();
    const peer = createPeerInstance(id, signalingHost);
    peerRef.current = peer;
    peer.on("error", handlePeerError);

    try {
      await waitForOpen(peer);
    } catch (err) {
      setPhase({ phase: "error", message: errorMessage(err) });
      teardownPeer();
      throw err;
    }

    roleRef.current = "host";
    roomIdRef.current = id;
    setRoomId(id);
    peer.on("connection", (conn: DataConnection) => wireConnection(conn));
    peer.on("disconnected", () => {
      setPhase({ phase: "reconnecting" });
      reconnectTimerRef.current = window.setTimeout(() => {
        try {
          peer.reconnect();
        } catch {
          /* peer destroyed */
        }
      }, RECONNECT_DELAY_MS);
    });
    setPhase({ phase: "ready", role: "host" });
    startHostTimers();
    return id;
  }, [handlePeerError, leaveRoom, setPhase, signalingHost, startHostTimers, teardownPeer, wireConnection]);

  const joinRoom = useCallback(
    async (input: string): Promise<void> => {
      const room = parseRoomLink(input);
      if (!room) {
        setPhase({ phase: "error", message: "Invalid room link or id." });
        return;
      }
      leaveRoom();
      destroyedRef.current = false;
      setPhase({ phase: "connecting" });

      const peer = createPeerInstance(undefined, signalingHost);
      peerRef.current = peer;
      peer.on("error", handlePeerError);
      roomIdRef.current = room;
      setRoomId(room);

      try {
        await waitForOpen(peer);
      } catch (error) {
        setPhase({ phase: "error", message: errorMessage(error) });
        teardownPeer();
        return;
      }

      roleRef.current = "guest";
      const conn = peer.connect(room, {
        reliable: true,
        metadata: { app: "agamiz-watch", mediaId: mediaIdRef.current },
      });
      wireConnection(conn);
      conn.on("open", () => {
        conn.send(buildMessage("PING"));
        setPhase({ phase: "ready", role: "guest" });
        startGuestTimers();
      });
      peer.on("disconnected", () => {
        setPhase({ phase: "reconnecting" });
        reconnectTimerRef.current = window.setTimeout(() => {
          try {
            peer.reconnect();
          } catch {
            /* peer destroyed */
          }
        }, RECONNECT_DELAY_MS);
      });
    },
    [handlePeerError, leaveRoom, setPhase, signalingHost, startGuestTimers, teardownPeer, wireConnection],
  );

  const emit = useCallback(
    (type: "PLAY" | "PAUSE" | "SEEK") => {
      if (roleRef.current !== "host") return;
      const player = getPlayerRef.current?.();
      const time = player ? player.getSnapshot().currentTime : 0;
      broadcast(buildMessage(type, { time }));
    },
    [broadcast],
  );

  useEffect(() => {
    let attached: HTMLVideoElement | null = null;
    let poll: number | null = null;

    const listeners = () => ({
      play: () => emit("PLAY"),
      pause: () => emit("PAUSE"),
      seeked: () => emit("SEEK"),
    });

    const attach = () => {
      if (attached) return;
      const video = getVideoRef.current?.() ?? null;
      if (!video) return;
      attached = video;
      const onPlay = listeners().play;
      const onPause = listeners().pause;
      const onSeeked = listeners().seeked;
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("seeked", onSeeked);
    };

    attach();
    if (!attached) {
      poll = window.setInterval(attach, 250);
      window.setTimeout(() => {
        if (poll !== null) window.clearInterval(poll);
      }, 5000);
    }

    return () => {
      if (poll !== null) window.clearInterval(poll);
      if (attached) {
        const onPlay = listeners().play;
        const onPause = listeners().pause;
        const onSeeked = listeners().seeked;
        attached.removeEventListener("play", onPlay);
        attached.removeEventListener("pause", onPause);
        attached.removeEventListener("seeked", onSeeked);
      }
    };
  }, [emit]);

  useEffect(
    () => () => {
      destroyedRef.current = true;
      teardownPeer();
    },
    [teardownPeer],
  );

  return useMemo(
    () => ({
      status,
      roomId,
      peers,
      isHost: roleRef.current === "host",
      createRoom,
      joinRoom,
      leaveRoom,
      emit,
    }),
    [status, roomId, peers, createRoom, joinRoom, leaveRoom, emit],
  );
}

function createPeerInstance(id: string | undefined, host: string): Peer {
  const options: PeerJSOption = {
    host,
    port: 443,
    secure: true,
    path: "/",
    debug: 0,
    config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    },
  };
  return id ? new Peer(id, options) : new Peer(options);
}

function waitForOpen(peer: Peer): Promise<void> {
  return new Promise((resolve, reject) => {
    const onOpen = () => {
      peer.off("error", onError);
      resolve();
    };
    const onError = (err: { type: string; message: string }) => {
      peer.off("open", onOpen);
      reject(err);
    };
    peer.once("open", onOpen);
    peer.once("error", onError);
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Connection failed.";
}