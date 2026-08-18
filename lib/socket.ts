import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  private getCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  }

  public connect(): Socket {
    if (!this.socket) {
      const token = this.getCookie("token") || (typeof localStorage !== "undefined" ? localStorage.getItem("token") : null);

      this.socket = io(this.backendUrl.replace("/api/v1", ""), {
        auth: {
          token
        }
      });

      this.socket.on("connect", () => {
        console.log("Connected to Socket.IO");
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from Socket.IO");
      });

      this.socket.on("error", (err: any) => {
        console.error("Socket error:", err);
      });
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("join_conversation", conversationId);
    }
  }

  public leaveConversation(conversationId: string) {
    if (this.socket) {
      this.socket.emit("leave_conversation", conversationId);
    }
  }
}

export const socketService = new SocketService();
