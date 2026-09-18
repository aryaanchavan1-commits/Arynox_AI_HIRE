import Groq from "groq-sdk";
import { config } from "../../config/index.js";
import { LLMProvider, LLMMessage, LLMResponse } from "../types.js";
import { logger } from "../../utils/logger.js";

export class GroqProvider implements LLMProvider {
  name = "groq";
  private client: Groq | null = null;

  constructor() {
    if (config.GROQ_API_KEY) {
      this.client = new Groq({ apiKey: config.GROQ_API_KEY });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(messages: LLMMessage[], options: { temperature?: number; maxTokens?: number } = {}): Promise<LLMResponse> {
    if (!this.client) throw new Error("Groq API key not configured");
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    });
    const latencyMs = Date.now() - start;
    const choice = response.choices[0];
    return {
      content: choice.message?.content || "",
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      tokens: { prompt: response.usage?.prompt_tokens || 0, completion: response.usage?.completion_tokens || 0, total: response.usage?.total_tokens || 0 },
      latencyMs,
    };
  }
}
