"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { socketService } from "@/lib/socket";

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface Batch {
  id: string;
  batchTitle: string;
}

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
  instructor: User;
  learner: User;
  batch: Batch | null;
  unreadCount: number;
  latestMessage: Message | null;
}

export default function LearnerFeedbackPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string>("");
  const selectedConvRef = useRef<Conversation | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id || payload.userId);
    } catch(e) {}
    
    fetchConversations();
    
    const socket = socketService.connect();
    
    socket.on("message:new", (msg: Message) => {
      setMessages((prev) => {
        if (prev.length > 0 && prev[0].conversationId === msg.conversationId) {
           return [...prev, msg];
        }
        return prev;
      });
      
      setConversations((prevConvs) => {
        return prevConvs.map(c => {
           if (c.id === msg.conversationId) {
              const isCurrentOpen = selectedConvRef.current?.id === msg.conversationId;
              if (isCurrentOpen) {
                  apiFetch(`/conversations/${msg.conversationId}/read`, { method: "PATCH" });
              }
              return {
                 ...c,
                 latestMessage: msg,
                 unreadCount: isCurrentOpen ? 0 : (msg.senderId !== userId ? c.unreadCount + 1 : c.unreadCount)
              }
           }
           return c;
        });
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/conversations");
      if (res.success || Array.isArray(res)) {
        setConversations(Array.isArray(res) ? res : (res.data || []));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv: Conversation) => {
    if (selectedConversation) {
        socketService.leaveConversation(selectedConversation.id);
    }
    
    setSelectedConversation(conv);
    setLoadingMessages(true);
    
    socketService.joinConversation(conv.id);

    try {
      const res = await apiFetch(`/conversations/${conv.id}/messages`);
      if (res.success || Array.isArray(res)) {
        setMessages(Array.isArray(res) ? res : (res.data || []));
      }
      
      if (conv.unreadCount > 0) {
          await apiFetch(`/conversations/${conv.id}/read`, { method: "PATCH" });
          setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await apiFetch(`/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.success || res.id) {
        setNewMessage("");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] bg-slate-950 p-6 flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Messages</h1>
        <p className="text-slate-400 mt-1">Chat with your instructors.</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        {/* Conversation List */}
        <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="font-semibold text-white">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
               <div className="p-8 text-center text-slate-500">No conversations found.</div>
            ) : (
                conversations.map((conv) => (
                <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                    selectedConversation?.id === conv.id ? "bg-slate-800" : ""
                    }`}
                >
                    <div className="flex justify-between items-center mb-1">
                    {/* Always show "Instructor" label — backend already filters out Admin conversations */}
                    <h3 className="font-semibold text-white">{conv.instructor?.fullName}</h3>
                    {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {conv.unreadCount}
                        </span>
                    )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {conv.latestMessage ? conv.latestMessage.message : "No messages yet"}
                    </p>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                    {selectedConversation.instructor?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-semibold text-white">{selectedConversation.instructor?.fullName}</h3>
                    <p className="text-xs text-slate-400">Instructor</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                   <div className="flex justify-center p-4"><div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
                ) : (
                   messages.map((msg) => {
                     const isMe = msg.senderRole === "LEARNER";
                     return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-800 text-slate-200 rounded-bl-none"
                          }`}>
                             <p className="whitespace-pre-wrap">{msg.message}</p>
                             <span className={`text-[10px] mt-1 block ${isMe ? "text-blue-200" : "text-slate-500"}`}>
                               {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        </div>
                     )
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
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
               <svg className="w-16 h-16 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
               </svg>
               <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}