"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import Button from "./ui/Button";

function Avatar({ username, size = 32 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-[#8de640] font-bold text-text-inverse"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {username?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function TypingPill({ typingUsers }) {
  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing…`
      : `${typingUsers[0]} and ${typingUsers.length - 1} more are typing…`;

  return <p className="px-1 text-[11px] text-text-muted">{label}</p>;
}

export default function LobbyOverlay({
  lobbyCode,
  currentUser,
  token,
  onSyncChange,
  onClose,
  onControllerReady,
  getPlaybackState,
}) {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingUsersRef = useRef(new Map());

  const [lobby, setLobby] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState("chat");
  const [isReady, setIsReady] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const isHost = Boolean(lobby && lobby.hostId === currentUser?.userId);

  const syncFromHost = useCallback((action, data = {}) => {
    if (!isHost || !socketRef.current) return;

    socketRef.current.emit("lobby:sync", { action, data }, (response) => {
      if (response?.error) {
        setError(response.error);
      }
    });
  }, [isHost]);

  useEffect(() => {
    onControllerReady?.({
      emitSync: syncFromHost,
      isHost,
    });

    return () => {
      onControllerReady?.(null);
    };
  }, [isHost, onControllerReady, syncFromHost]);

  const startCountdown = useCallback((seconds) => {
    setCountdown(seconds);
    clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((value) => {
        if (value == null || value <= 1) {
          clearInterval(countdownTimerRef.current);
          return null;
        }
        return value - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => {
    clearInterval(countdownTimerRef.current);
    clearTimeout(typingTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!lobbyCode || !token || !currentUser) return;

    const socket = getSocket(token);
    if (!socket) {
      const timer = window.setTimeout(() => {
        setError("Socket connection failed.");
      }, 0);
      return () => clearTimeout(timer);
    }

    socketRef.current = socket;

    socket.emit("lobby:join", { code: lobbyCode }, (response) => {
      if (response?.error) {
        setError(response.error);
        return;
      }

      setError("");
      setLobby(response.lobby);
      setMembers(response.members || []);
      setMessages(response.messages || []);
      setConnected(true);
      onSyncChange?.(response.sync);
    });

    const handleMemberJoined = (member) => {
      setMembers((prev) => {
        if (prev.some((item) => item.userId === member.userId)) return prev;
        return [...prev, member];
      });
    };

    const handleMemberLeft = ({ userId }) => {
      setMembers((prev) => prev.filter((member) => member.userId !== userId));
    };

    const handleHostChanged = ({ newHostId }) => {
      setLobby((prev) => (prev ? { ...prev, hostId: newHostId } : prev));
    };

    const handleChat = (message) => {
      setMessages((prev) => [...prev.slice(-199), message]);
    };

    const handleReadyUpdate = ({ userId, isReady: ready }) => {
      setMembers((prev) =>
        prev.map((member) => (member.userId === userId ? { ...member, isReady: ready } : member))
      );
    };

    const handleTyping = ({ userId, username, isTyping }) => {
      if (userId === currentUser.userId) return;

      if (isTyping) {
        typingUsersRef.current.set(userId, username);
      } else {
        typingUsersRef.current.delete(userId);
      }

      setTypingUsers(Array.from(typingUsersRef.current.values()));
    };

    const handleSync = (event) => {
      onSyncChange?.(event);
      if (event.action === "play" && event.fromUserId !== currentUser.userId) {
        startCountdown(3);
      }
    };

    socket.on("lobby:member-joined", handleMemberJoined);
    socket.on("lobby:member-left", handleMemberLeft);
    socket.on("lobby:host-changed", handleHostChanged);
    socket.on("lobby:chat", handleChat);
    socket.on("lobby:ready-update", handleReadyUpdate);
    socket.on("lobby:typing", handleTyping);
    socket.on("lobby:sync", handleSync);

    return () => {
      socket.off("lobby:member-joined", handleMemberJoined);
      socket.off("lobby:member-left", handleMemberLeft);
      socket.off("lobby:host-changed", handleHostChanged);
      socket.off("lobby:chat", handleChat);
      socket.off("lobby:ready-update", handleReadyUpdate);
      socket.off("lobby:typing", handleTyping);
      socket.off("lobby:sync", handleSync);
    };
  }, [currentUser, lobbyCode, onSyncChange, startCountdown, token]);

  useEffect(() => {
    if (!connected || !socketRef.current || !getPlaybackState) return;

    const interval = setInterval(() => {
      const state = getPlaybackState();
      socketRef.current.emit("lobby:ping", {
        clientPosition: state?.currentTime || 0,
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [connected, getPlaybackState]);

  const sendTypingState = useCallback((isTyping) => {
    if (!socketRef.current) return;
    socketRef.current.emit("lobby:typing", { isTyping });
  }, []);

  const handleChatInput = useCallback((value) => {
    setChatInput(value);
    sendTypingState(value.trim().length > 0);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingState(false);
    }, 900);
  }, [sendTypingState]);

  const sendMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;

    socketRef.current.emit("lobby:chat", { text });
    setChatInput("");
    sendTypingState(false);
  }, [chatInput, sendTypingState]);

  const toggleReady = useCallback(() => {
    if (!socketRef.current) return;

    const nextValue = !isReady;
    setIsReady(nextValue);
    socketRef.current.emit("lobby:ready", { isReady: nextValue });
  }, [isReady]);

  const leaveLobby = useCallback(() => {
    socketRef.current?.emit("lobby:leave");
    onClose?.();
  }, [onClose]);

  const copyInvite = useCallback(() => {
    if (!lobbyCode) return;
    const url = new URL(window.location.href);
    url.searchParams.set("lobby", lobbyCode);
    navigator.clipboard.writeText(url.toString()).catch(() => {});
  }, [lobbyCode]);

  const orderedMembers = useMemo(
    () =>
      [...members].sort((left, right) => {
        if (left.userId === lobby?.hostId) return -1;
        if (right.userId === lobby?.hostId) return 1;
        return left.username.localeCompare(right.username);
      }),
    [lobby?.hostId, members]
  );

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-xs text-[14px] leading-6 text-crimson">{error}</p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-7 w-7 rounded-full border-2 border-accent/40 border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/72 backdrop-blur-sm">
          <span className="text-[96px] font-black text-accent">{countdown}</span>
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <p className="truncate text-[14px] font-semibold text-text-primary">
              {lobby?.movieTitle || "Watch Party"}
            </p>
          </div>
          <p className="mt-1 text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-text-muted">
            {lobby?.isPrivate ? "Private room" : "Public room"}
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={copyInvite}>
          {lobbyCode}
        </Button>
        <Button variant="danger" size="sm" onClick={leaveLobby}>
          Leave
        </Button>
      </div>

      {isHost ? (
        <div className="border-b border-white/[0.06] px-4 py-3">
          <p className="mb-2 text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.16em] text-text-muted">
            Host Controls
          </p>
          <div className="flex gap-2">
            <Button
              variant="accentSoft"
              size="sm"
              className="flex-1"
              onClick={() => {
                const playback = getPlaybackState?.();
                syncFromHost("play", { position: playback?.currentTime || 0 });
                startCountdown(3);
              }}
            >
              Play for everyone
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => {
                const playback = getPlaybackState?.();
                syncFromHost("pause", { position: playback?.currentTime || 0 });
              }}
            >
              Pause for everyone
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-b border-white/[0.06] px-4 py-3">
          <Button
            variant={isReady ? "accentSoft" : "secondary"}
            size="sm"
            className="w-full"
            onClick={toggleReady}
          >
            {isReady ? "Ready to start" : "Mark as ready"}
          </Button>
        </div>
      )}

      <div className="flex gap-1 px-3 pt-3">
        {[
          { id: "chat", label: "Chat" },
          { id: "members", label: `Members (${members.length})` },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold transition-colors ${
              tab === item.id
                ? "bg-accent/10 text-accent"
                : "text-text-muted hover:bg-white/[0.04] hover:text-text-primary"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "members" ? (
        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {orderedMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
            >
              <Avatar username={member.username} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text-primary">{member.username}</p>
                <p className="text-[11px] text-text-muted">
                  {member.userId === lobby?.hostId ? "Host" : member.isReady ? "Ready" : "Watching"}
                </p>
              </div>
              {member.userId === lobby?.hostId && (
                <span className="rounded-full border border-amber/20 bg-amber/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber">
                  Host
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[13px] text-text-muted">Start the conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isMe = message.userId === currentUser?.userId;
                  return (
                    <div key={`${message.userId}-${message.sentAt}-${index}`} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                      <Avatar username={message.username} size={26} />
                      <div className={`flex max-w-[78%] flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                        {!isMe && (
                          <span className="px-1 text-[10px] uppercase tracking-[0.12em] text-text-muted">
                            {message.username}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-3 py-2 text-[13px] leading-6 ${
                            isMe
                              ? "rounded-br-sm bg-accent/14 text-text-primary"
                              : "rounded-bl-sm bg-white/[0.05] text-text-primary"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-white/[0.06] px-3 py-3">
            <TypingPill typingUsers={typingUsers} />
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(event) => handleChatInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                maxLength={500}
                placeholder="Message the room…"
                className="input-dark !h-11 !rounded-2xl !px-4"
              />
              <Button variant="primary" size="sm" onClick={sendMessage} disabled={!chatInput.trim()}>
                Send
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
