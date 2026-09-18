import { FastifyInstance } from "fastify";
import { SarvamSTTProvider } from "../ai/voice/sarvam-stt.js";
import { SarvamTTSProvider } from "../ai/voice/sarvam-tts.js";
import { config } from "../config/index.js";

export async function voiceRoutes(app: FastifyInstance) {
  const stt = new SarvamSTTProvider();
  const tts = new SarvamTTSProvider();

  app.get("/status", async () => ({
    stt: { provider: "sarvam", available: stt.isAvailable(), mockMode: !stt.isAvailable() },
    tts: { provider: "sarvam", available: tts.isAvailable(), mockMode: !tts.isAvailable() },
    languages: ["en", "hi", "mr"],
  }));

  app.post("/stt", async (request, reply) => {
    const parts = await request.file();
    if (!parts) {
      return reply.status(400).send({ error: "No audio file provided" });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of parts.file) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const language = (parts.fields as any)?.language?.value || "en";

    if (!stt.isAvailable()) {
      return {
        mockMode: true,
        text: "[Mock STT - Sarvam API key not configured]",
        confidence: 0.9,
        language,
      };
    }

    try {
      const result = await stt.transcribe(audioBuffer, language);
      return result;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  app.post("/tts", async (request, reply) => {
    const { text, language } = request.body as { text: string; language?: string };

    if (!text) {
      return reply.status(400).send({ error: "Text is required" });
    }

    if (!tts.isAvailable()) {
      return {
        mockMode: true,
        message: "Sarvam TTS mock mode",
        audio: null,
        format: "audio/wav",
      };
    }

    try {
      const result = await tts.synthesize(text, language || "en");
      reply.header("Content-Type", result.format);
      reply.header("X-Audio-Duration-Ms", result.durationMs.toString());
      return result.audioBuffer;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
