import { TTSProvider, TTSResult } from "../types.js";
import { config } from "../../config/index.js";
import { SarvamTTSProvider } from "./sarvam-tts.js";

class MockTTSProvider implements TTSProvider {
  name = "mock-tts";
  isAvailable() { return true; }
  async synthesize(text: string, language = "en"): Promise<TTSResult> {
    await new Promise((r) => setTimeout(r, 200));
    const audioBuffer = Buffer.from(new ArrayBuffer(1024));
    return { audioBuffer, format: "audio/wav", durationMs: Math.max(1000, text.length * 50) };
  }
}

export function getTTSProvider(): TTSProvider {
  if (config.TTS_PROVIDER === "sarvam" && config.TTS_API_KEY) {
    const sarvam = new SarvamTTSProvider();
    if (sarvam.isAvailable()) return sarvam;
  }
  return new MockTTSProvider();
}
