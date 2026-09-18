import { STTProvider, STTResult } from "../types.js";
import { config } from "../../config/index.js";
import { SarvamSTTProvider } from "./sarvam-stt.js";

class MockSTTProvider implements STTProvider {
  name = "mock-stt";
  isAvailable() { return true; }
  async transcribe(_audio: Buffer, language = "en"): Promise<STTResult> {
    await new Promise((r) => setTimeout(r, 200));
    return { text: "[Mock STT transcription - Sarvam API key not configured]", confidence: 0.9, language };
  }
}

export function getSTTProvider(): STTProvider {
  if (config.STT_PROVIDER === "sarvam" && config.STT_API_KEY) {
    const sarvam = new SarvamSTTProvider();
    if (sarvam.isAvailable()) return sarvam;
  }
  return new MockSTTProvider();
}
