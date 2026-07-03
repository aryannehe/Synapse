import axios from "axios";
import { Document, SupportTicket, PromptTemplate, AnalyticsStats, mockPrompts } from "./mockData";

export interface SearchResponse {
  documents: Document[];
  aiAnswer?: {
    answer: string;
    confidence: number;
    summary: string;
    sources: string[];
    relatedTopics: string[];
  };
}

export const serviceLayer = {
  // 1. Knowledge Module Search Service
  searchArticles: async (
    query: string,
    category: string,
    sortBy: string
  ): Promise<SearchResponse> => {
    const response = await axios.get<SearchResponse>(
      `/api/knowledge?search=${encodeURIComponent(query)}&category=${category}&sortBy=${sortBy}`
    );
    return response.data;
  },

  // 2. Support Module Service
  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await axios.get<{ tickets: SupportTicket[] }>("/api/tickets");
    return response.data.tickets;
  },

  getTicketById: async (id: string): Promise<SupportTicket | undefined> => {
    const response = await axios.get<SupportTicket>(`/api/tickets/${id}`);
    return response.data;
  },

  createTicket: async (
    category: string,
    summary: string,
    message: string
  ): Promise<SupportTicket> => {
    const response = await axios.post<SupportTicket>("/api/tickets", {
      category,
      summary,
      message,
    });
    return response.data;
  },

  updateTicketStatus: async (
    id: string,
    status: SupportTicket["status"]
  ): Promise<SupportTicket> => {
    const response = await axios.patch<SupportTicket>(`/api/tickets/${id}`, { status });
    return response.data;
  },

  updateTicketPriority: async (
    id: string,
    priority: SupportTicket["priority"]
  ): Promise<SupportTicket> => {
    const response = await axios.patch<SupportTicket>(`/api/tickets/${id}`, { priority });
    return response.data;
  },

  addTicketMessage: async (
    ticketId: string,
    text: string,
    sender: "customer" | "agent"
  ): Promise<SupportTicket> => {
    const response = await axios.post<SupportTicket>(`/api/tickets/${ticketId}`, {
      text,
      type: "message",
    });
    return response.data;
  },

  addInternalNote: async (ticketId: string, text: string): Promise<SupportTicket> => {
    const response = await axios.post<SupportTicket>(`/api/tickets/${ticketId}`, {
      text,
      type: "note",
    });
    return response.data;
  },

  // 3. Assistant Module Service
  getPrompts: async (): Promise<PromptTemplate[]> => {
    return [...mockPrompts];
  },

  // Simulated streaming assistant response
  streamAIResponse: (
    model: string,
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ) => {
    let active = true;
    let fullText = "";

    const fetchStream = async () => {
      try {
        const response = await fetch("/api/assistant/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, model }),
        });

        if (!response.ok) {
          throw new Error("Stream response failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Body reader unavailable");

        const decoder = new TextDecoder();

        while (active) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          onChunk(chunk);
        }

        if (active) {
          onComplete(fullText);
        }
      } catch (err) {
        console.error("Chat stream fetch failed:", err);
        onChunk("An error occurred connecting to the streaming assistant. Please verify your connection.");
        onComplete("An error occurred connecting to the streaming assistant. Please verify your connection.");
      }
    };

    fetchStream();

    // Return simple cancel callback to terminate downstream loop on unmount
    return () => {
      active = false;
    };
  },

  // 4. Analytics Hub service
  getAnalyticsStats: async (): Promise<AnalyticsStats> => {
    const response = await axios.get<AnalyticsStats>("/api/analytics");
    return response.data;
  },

  // 5. Update Profile Service
  updateProfile: async (name: string): Promise<{ success: boolean; user: { id: string; name: string; email: string; role: string; avatar: string } }> => {
    const response = await axios.patch("/api/auth/profile", { name });
    return response.data;
  },
};
