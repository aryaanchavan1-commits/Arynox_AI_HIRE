import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

const TAVUS_API_BASE = "https://tavusapi.com/v2";

export interface TavusVideoResponse {
  video_id: string;
  video_name: string;
  status: string;
  hosted_url: string | null;
  download_url: string | null;
  created_at: string;
}

export interface TavusConversationResponse {
  conversation_id: string;
  room_url: string;
  meeting_token?: string;
}

export class TavusProvider {
  name = "tavus";
  private apiKey: string;

  constructor() {
    this.apiKey = config.TAVUS_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateVideo(params: {
    replicaId?: string;
    script: string;
    videoName?: string;
    callbackUrl?: string;
  }): Promise<TavusVideoResponse> {
    if (!this.apiKey) {
      throw new Error("Tavus API key not configured");
    }

    const response = await fetch(`${TAVUS_API_BASE}/videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({
        replica_id: params.replicaId || "r_default",
        script: params.script,
        video_name: params.videoName || "ARYNOX AI Interview",
        callback_url: params.callbackUrl,
        start_with_wave: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Tavus video error: ${response.status} - ${error}`);
      throw new Error(`Tavus video generation failed: ${response.status}`);
    }

    return response.json();
  }

  async getVideoStatus(videoId: string): Promise<TavusVideoResponse> {
    if (!this.apiKey) {
      throw new Error("Tavus API key not configured");
    }

    const response = await fetch(`${TAVUS_API_BASE}/videos/${videoId}`, {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Tavus get video failed: ${response.status}`);
    }

    return response.json();
  }

  async createConversation(params: {
    faceId?: string;
    palId?: string;
    audioOnly?: boolean;
    conversationName?: string;
    conversationalContext?: string;
    customGreeting?: string;
  }): Promise<TavusConversationResponse> {
    if (!this.apiKey) {
      throw new Error("Tavus API key not configured");
    }

    const body: Record<string, any> = {
      audio_only: params.audioOnly ?? false,
      conversation_name: params.conversationName || "ARYNOX AI Interview",
      conversational_context: params.conversationalContext,
      custom_greeting: params.customGreeting || "Hello! I'm your AI interviewer from ARYNOX AI HIRE. Let's begin the interview.",
    };

    if (params.faceId) body.face_id = params.faceId;
    if (params.palId) body.pal_id = params.palId;

    const response = await fetch(`${TAVUS_API_BASE}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Tavus conversation error: ${response.status} - ${error}`);
      throw new Error(`Tavus conversation failed: ${response.status}`);
    }

    return response.json();
  }

  async listFaces(): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error("Tavus API key not configured");
    }

    const response = await fetch(`${TAVUS_API_BASE}/faces`, {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Tavus list faces failed: ${response.status}`);
    }

    const data = await response.json();
    return data.faces || [];
  }

  async createFace(params: {
    faceName: string;
    trainVideoUrl?: string;
    trainImageUrl?: string;
    voiceName?: string;
    callbackUrl?: string;
  }): Promise<any> {
    if (!this.apiKey) {
      throw new Error("Tavus API key not configured");
    }

    const body: Record<string, any> = {
      face_name: params.faceName,
      callback_url: params.callbackUrl,
    };

    if (params.trainVideoUrl) body.train_video_url = params.trainVideoUrl;
    if (params.trainImageUrl) body.train_image_url = params.trainImageUrl;
    if (params.voiceName) body.voice_name = params.voiceName;

    const response = await fetch(`${TAVUS_API_BASE}/faces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Tavus create face error: ${response.status} - ${error}`);
      throw new Error(`Tavus create face failed: ${response.status}`);
    }

    return response.json();
  }
}

let tavusInstance: TavusProvider | null = null;

export function getTavusProvider(): TavusProvider {
  if (!tavusInstance) {
    tavusInstance = new TavusProvider();
  }
  return tavusInstance;
}
