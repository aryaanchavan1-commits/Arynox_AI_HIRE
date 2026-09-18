import OpenAI from "openai";
import { config } from "../../config/index.js";
import { LLMProvider, LLMMessage, LLMResponse } from "../types.js";

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private client: OpenAI | null = null;

  constructor() {
    if (config.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(messages: LLMMessage[], options: { temperature?: number; maxTokens?: number } = {}): Promise<LLMResponse> {
    if (!this.client) throw new Error("OpenAI API key not configured");
    const start = Date.now();
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    });
    const latencyMs = Date.now() - start;
    const choice = response.choices[0];
    return {
      content: choice.message?.content || "",
      provider: "openai",
      model: "gpt-4o",
      tokens: { prompt: response.usage?.prompt_tokens || 0, completion: response.usage?.completion_tokens || 0, total: response.usage?.total_tokens || 0 },
      latencyMs,
    };
  }
}
