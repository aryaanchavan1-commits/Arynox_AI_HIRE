import { FastifyInstance } from "fastify";
import { getTavusProvider } from "../ai/avatar/tavus-provider.js";
import { config } from "../config/index.js";

export async function avatarRoutes(app: FastifyInstance) {
  const tavus = getTavusProvider();

  app.get("/status", async () => ({
    available: tavus.isAvailable(),
    provider: "tavus",
    mockMode: !tavus.isAvailable(),
  }));

  app.get("/faces", async (request, reply) => {
    if (!tavus.isAvailable()) {
      return { faces: [], mockMode: true, message: "Tavus API key not configured. Using mock avatar." };
    }
    try {
      const faces = await tavus.listFaces();
      return { faces };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post("/video", async (request, reply) => {
    const { replicaId, script, videoName } = request.body as {
      replicaId?: string;
      script: string;
      videoName?: string;
    };

    if (!script) {
      return reply.status(400).send({ error: "Script is required" });
    }

    if (!tavus.isAvailable()) {
      return {
        mockMode: true,
        message: "Tavus mock mode - no video generated",
        video: {
          video_id: "mock-" + Date.now(),
          status: "ready",
          hosted_url: null,
          script,
        },
      };
    }

    try {
      const result = await tavus.generateVideo({
        replicaId,
        script,
        videoName: videoName || "AI Interview Response",
      });
      return result;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.get("/video/:videoId", async (request, reply) => {
    const { videoId } = request.params as { videoId: string };

    if (!tavus.isAvailable()) {
      return {
        mockMode: true,
        video_id: videoId,
        status: "ready",
        hosted_url: null,
      };
    }

    try {
      const result = await tavus.getVideoStatus(videoId);
      return result;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post("/conversation", async (request, reply) => {
    const { faceId, palId, conversationalContext, customGreeting } = request.body as {
      faceId?: string;
      palId?: string;
      conversationalContext?: string;
      customGreeting?: string;
    };

    if (!tavus.isAvailable()) {
      return {
        mockMode: true,
        message: "Tavus mock mode - using built-in 3D avatar",
        conversation_id: "mock-" + Date.now(),
        room_url: null,
      };
    }

    try {
      const result = await tavus.createConversation({
        faceId,
        palId,
        audioOnly: false,
        conversationName: "ARYNOX AI Interview",
        conversationalContext,
        customGreeting,
      });
      return result;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post("/face", async (request, reply) => {
    const { faceName, trainVideoUrl, trainImageUrl, voiceName } = request.body as {
      faceName: string;
      trainVideoUrl?: string;
      trainImageUrl?: string;
      voiceName?: string;
    };

    if (!tavus.isAvailable()) {
      return reply.status(200).send({
        mockMode: true,
        message: "Tavus mock mode - face creation simulated",
      });
    }

    try {
      const result = await tavus.createFace({
        faceName,
        trainVideoUrl,
        trainImageUrl,
        voiceName,
      });
      return result;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
