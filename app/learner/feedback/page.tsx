"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { socketService } from "@/lib/socket";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  instructorId: string;
  learnerId: string;
  batchId: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
  unreadCount: number;
}

export default function LearnerFeedbackPage() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string>("");
  const conversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("lms_auth_token") || "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserId(payload.id || payload.userId);
    } catch (e) {}

    fetchConversation();

    const socket = socketService.connect();

    socket.on("message:new", (msg: Message) => {
      if (
        conversationRef.current &&
        conversationRef.current.id === msg.conversationId
      ) {
        setMessages((prev) => {
          if (!prev.some((m) => m.id === msg.id)) {
            return [...prev, msg];
          }
          return prev;
        });
        apiFetch(`/conversations/${msg.conversationId}/read`, {
          method: "PATCH",
        });
      }
    });

    socket.on("connect", () => {
      if (conversationRef.current) {
        socketService.joinConversation(conversationRef.current.id);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const res: any = await apiFetch("/conversations/learner/feedback");
      if (res && res.id) {
        setConversation(res);
        setMessages(res.messages || []);
        socketService.joinConversation(res.id);

        if (res.unreadCount > 0) {
          await apiFetch(`/conversations/${res.id}/read`, { method: "PATCH" });
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      const res: any = await apiFetch(
        `/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ message: newMessage }),
        },
      );
      if (res.success || res.id) {
        setNewMessage("");
        const sentMsg = res.data || res;
        if (sentMsg && sentMsg.id) {
          setMessages((prev) => {
            if (!prev.some((m) => m.id === sentMsg.id)) {
              return [...prev, sentMsg];
            }
            return prev;
          });
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] bg-slate-950 p-6 flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Feedback
        </h1>
        <p className="text-slate-400 mt-1">
          Communicate directly with your instructor.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl flex-col relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
            I
          </div>
          <div>
            <h3 className="font-semibold text-white">Instructor</h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
              Online
            </p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full">
              <svg
                className="w-16 h-16 mb-4 text-slate-700"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
              <p className="text-lg font-medium text-slate-400 mb-1">
                No feedback messages yet.
              </p>
              <p className="text-sm">You can start the conversation here.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === "LEARNER";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-slate-800 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <span
                      className={`text-[10px] mt-1 block ${isMe ? "text-blue-200" : "text-slate-500"}`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <span>Send</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
