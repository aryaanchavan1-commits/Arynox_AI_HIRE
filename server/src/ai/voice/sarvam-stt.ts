import { STTProvider, STTResult } from "../types.js";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

const SARVAM_API_BASE = "https://api.sarvam.ai";

export class SarvamSTTProvider implements STTProvider {
  name = "sarvam-stt";
  private apiKey: string;

  constructor() {
    this.apiKey = config.STT_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async transcribe(audioBuffer: Buffer, language = "en"): Promise<STTResult> {
    const langMap: Record<string, string> = {
      en: "en-IN",
      hi: "hi-IN",
      mr: "mr-IN",
    };
    const languageCode = langMap[language] || "en-IN";

    const formData = new FormData();
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/wav" });
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "saaras:v3");
    formData.append("language_code", languageCode);
    formData.append("mode", "transcribe");

    const response = await fetch(`${SARVAM_API_BASE}/speech-to-text`, {
      method: "POST",
      headers: {
        "api-subscription-key": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Sarvam STT error: ${response.status} - ${error}`);
      throw new Error(`Sarvam STT failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      text: data.transcript || "",
      confidence: data.language_probability || 0.9,
      language: data.language_code || languageCode,
    };
  }
}
