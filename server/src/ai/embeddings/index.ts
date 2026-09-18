import { EmbeddingProvider, EmbeddingResult } from "../types.js";
import { config } from "../../config/index.js";

class MockEmbeddingProvider implements EmbeddingProvider {
  name = "mock-embedding";
  isAvailable() { return true; }
  async embed(text: string): Promise<EmbeddingResult> {
    const dim = 384;
    const embedding = Array.from({ length: dim }, () => Math.random() * 2 - 1);
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    return { embedding: embedding.map((v) => v / norm), tokens: text.split(/\s+/).length };
  }
}

export function getEmbeddingProvider(): EmbeddingProvider {
  return new MockEmbeddingProvider();
}
