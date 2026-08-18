"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

interface LearnerProfile {
  id: string;
  userId: string;
  batchId: string;
  user: User;
  batch?: Batch;
}

function AdminChatContent() {
  const searchParams = useSearchParams();
  const learnerIdParam = searchParams.get("learnerId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string>("");
  const selectedConvRef = useRef<Conversation | null>(null);

  const [learners, setLearners] = useState<LearnerProfile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedNewLearner, setSelectedNewLearner] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("lms_auth_token") || "";
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.id || payload.userId);
    } catch(e) {}
    
    fetchInitialData();
    
    const socket = socketService.connect();
    
    socket.on("message:new", (msg: Message) => {
      setMessages((prev) => {
        if (selectedConvRef.current?.id === msg.conversationId) {
           // Prevent duplicate messages
           if (!prev.some(m => m.id === msg.id)) {
               return [...prev, msg];
           }
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

    socket.on("connect", () => {
      if (selectedConvRef.current) {
        socketService.joinConversation(selectedConvRef.current.id);
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
    selectedConvRef.current = selectedConversation;
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [convRes, learnersRes] = await Promise.all([
         apiFetch("/conversations"),
         apiFetch("/learner/admin/all")
      ]);
      
      let loadedConvs: Conversation[] = [];
      if (convRes.success || Array.isArray(convRes)) {
        loadedConvs = Array.isArray(convRes) ? convRes : (convRes.data || []);
        setConversations(loadedConvs);
      }
      
      if (learnersRes.success) {
         setLearners(learnersRes.data || []);
      }

      // If redirected from learner profile with learnerId
      if (learnerIdParam) {
          const existingConv = loadedConvs.find(c => c.learnerId === learnerIdParam);
          if (existingConv) {
              selectConversation(existingConv);
          } else {
              // Start a new conversation automatically
              const learner = (learnersRes.data || []).find((l: any) => l.userId === learnerIdParam);
              if (learner) {
                 startNewConversation(learnerIdParam, learner.batchId);
              }
          }
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
    setShowNewChat(false);
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

  const startNewConversation = async (learnerId: string, batchId?: string) => {
      try {
          const res: any = await apiFetch("/conversations", {
              method: "POST",
              body: JSON.stringify({ learnerId, batchId })
          });
          if (res.id) {
              // Reload conversations and select the new one
              const updatedConvs: any = await apiFetch("/conversations");
              if (updatedConvs.success || Array.isArray(updatedConvs)) {
                  const arr = Array.isArray(updatedConvs) ? updatedConvs : updatedConvs.data;
                  setConversations(arr);
                  const newlyCreated = arr.find((c: any) => c.id === res.id);
                  if (newlyCreated) selectConversation(newlyCreated);
              }
          }
      } catch (err: any) {
          console.error(err);
      }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res: any = await apiFetch(`/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: newMessage }),
      });
      if (res.success || res.id) {
        setNewMessage("");
        const sentMsg = res.data || res;
        if (sentMsg && sentMsg.id) {
           setMessages(prev => {
              if (!prev.some(m => m.id === sentMsg.id)) {
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
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] bg-slate-950 p-6 flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Chat with Learners</h1>
        <p className="text-slate-400 mt-1">Communicate directly with your learners.</p>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        {/* Conversation List */}
        {!learnerIdParam && (
        <div className="w-1/3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h2 className="font-semibold text-white">Conversations</h2>
            <button 
                onClick={() => setShowNewChat(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-colors"
                title="New Chat"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
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
                    <h3 className="font-semibold text-white">{conv.learner?.fullName}</h3>
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
        </div>)}

        {/* Chat Window */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative">
          
          {showNewChat ? (
             <div className="flex-1 flex flex-col p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Start a New Chat</h2>
                    <button onClick={() => setShowNewChat(false)} className="text-slate-400 hover:text-white">
                        Cancel
                    </button>
                 </div>
                 <div className="space-y-4">
                     <label className="block text-sm font-medium text-slate-300">Select Learner</label>
                     <select
                        value={selectedNewLearner}
                        onChange={(e) => setSelectedNewLearner(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                     >
                        <option value="">-- Select a Learner --</option>
                        {learners.map((l) => (
                           <option key={l.userId} value={l.userId}>
                              {l.user?.fullName} ({l.batch?.batchTitle || "No Batch"})
                           </option>
                        ))}
                     </select>
                     <button
                        onClick={() => {
                            const l = learners.find(x => x.userId === selectedNewLearner);
                            if (l) startNewConversation(l.userId, l.batchId);
                        }}
                        disabled={!selectedNewLearner}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 disabled:opacity-50 transition-colors"
                     >
                         Start Chat
                     </button>
                 </div>
             </div>
          ) : selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                    {selectedConversation.learner?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="font-semibold text-white">{selectedConversation.learner?.fullName}</h3>
                    <p className="text-xs text-slate-400">{selectedConversation.batch?.batchTitle || "Learner"}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                   <div className="flex justify-center p-4"><div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
                ) : (
                   messages.map((msg) => {
                     // "Me" is anyone who is NOT a learner (covers both ADMIN and INSTRUCTOR)
                     const isMe = msg.senderRole !== "LEARNER";
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
               <p>Select a conversation or start a new chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
   return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-950"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>}>
         <AdminChatContent />
      </Suspense>
   );
}