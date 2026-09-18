"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface TavusState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  roomUrl: string | null;
  conversationId: string | null;
}

interface TavusMessage {
  type: string;
  content?: string;
  timestamp: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useTavusAvatar() {
  const [state, setState] = useState<TavusState>({
    connected: false,
    connecting: false,
    error: null,
    roomUrl: null,
    conversationId: null,
  });
  const [messages, setMessages] = useState<TavusMessage[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const startConversation = useCallback(async (params?: {
    context?: string;
    customGreeting?: string;
    faceId?: string;
  }) => {
    setState((s) => ({ ...s, connecting: true, error: null }));

    try {
      const response = await fetch(`${API_URL}/api/avatar/conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          conversationalContext: params?.context || "Technical interview for a software engineering position",
          customGreeting: params?.customGreeting || "Hello! I'm your AI interviewer from ARYNOX AI HIRE. Let's begin the interview.",
          faceId: params?.faceId,
        }),
      });

      const data = await response.json();

      if (data.mockMode) {
        setState({
          connected: false,
          connecting: false,
          error: null,
          roomUrl: null,
          conversationId: null,
        });
        return { mockMode: true };
      }

      setState({
        connected: true,
        connecting: false,
        error: null,
        roomUrl: data.room_url,
        conversationId: data.conversation_id,
      });

      return data;
    } catch (err: any) {
      setState((s) => ({
        ...s,
        connecting: false,
        error: err.message || "Failed to start Tavus conversation",
      }));
      return null;
    }
  }, []);

  const endConversation = useCallback(() => {
    setState({
      connected: false,
      connecting: false,
      error: null,
      roomUrl: null,
      conversationId: null,
    });
    setMessages([]);
  }, []);

  const addMessage = useCallback((type: string, content?: string) => {
    setMessages((prev) => [
      ...prev,
      { type, content, timestamp: Date.now() },
    ]);
  }, []);

  return {
    state,
    messages,
    iframeRef,
    startConversation,
    endConversation,
    addMessage,
  };
}

function getAuthToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token") || "demo-token";
  }
  return "demo-token";
}
