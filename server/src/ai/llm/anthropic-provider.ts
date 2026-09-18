import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config/index.js";
import { LLMProvider, LLMMessage, LLMResponse } from "../types.js";

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private client: Anthropic | null = null;

  constructor() {
    if (config.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async chat(messages: LLMMessage[], options: { temperature?: number; maxTokens?: number } = {}): Promise<LLMResponse> {
    if (!this.client) throw new Error("Anthropic API key not configured");
    const start = Date.now();
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystem = messages.filter((m) => m.role !== "system");
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      system: systemMsg?.content || "",
      messages: nonSystem.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });
    const latencyMs = Date.now() - start;
    const textBlock = response.content.find((b) => b.type === "text");
    return {
      content: textBlock?.text || "",
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      tokens: { prompt: response.usage.input_tokens, completion: response.usage.output_tokens, total: response.usage.input_tokens + response.usage.output_tokens },
      latencyMs,
    };
  }
}
