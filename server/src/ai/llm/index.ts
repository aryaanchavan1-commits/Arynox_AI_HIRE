import { config } from "../../config/index.js";
import { LLMProvider } from "../types.js";
import { GroqProvider } from "./groq-provider.js";
import { OpenAIProvider } from "./openai-provider.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { MockLLMProvider } from "./mock-provider.js";

let provider: LLMProvider;

export function getLLMProvider(): LLMProvider {
  if (provider) return provider;

  switch (config.LLM_PROVIDER) {
    case "groq":
      provider = new GroqProvider();
      if (!provider.isAvailable()) { provider = new MockLLMProvider(); }
      break;
    case "openai":
      provider = new OpenAIProvider();
      if (!provider.isAvailable()) { provider = new MockLLMProvider(); }
      break;
    case "anthropic":
      provider = new AnthropicProvider();
      if (!provider.isAvailable()) { provider = new MockLLMProvider(); }
      break;
    default:
      provider = new MockLLMProvider();
  }

  return provider;
}
