import { TTSProvider, TTSResult } from "../types.js";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";

const SARVAM_API_BASE = "https://api.sarvam.ai";

const SPEAKER_MAP: Record<string, Record<string, string>> = {
  en: { male: "shubh", female: "priya" },
  hi: { male: "shubh", female: "priya" },
  mr: { male: "shubh", female: "priya" },
};

const LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export class SarvamTTSProvider implements TTSProvider {
  name = "sarvam-tts";
  private apiKey: string;

  constructor() {
    this.apiKey = config.TTS_API_KEY;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async synthesize(text: string, language = "en"): Promise<TTSResult> {
    const languageCode = LANG_MAP[language] || "en-IN";
    const speakers = SPEAKER_MAP[language] || SPEAKER_MAP.en;
    const speaker = speakers.male;

    const response = await fetch(`${SARVAM_API_BASE}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": this.apiKey,
      },
      body: JSON.stringify({
        text: text.substring(0, 2500),
        target_language_code: languageCode,
        model: "bulbul:v3",
        speaker: speaker,
        speech_sample_rate: 24000,
        output_audio_codec: "wav",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`Sarvam TTS error: ${response.status} - ${error}`);
      throw new Error(`Sarvam TTS failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.audios || !data.audios[0]) {
      throw new Error("Sarvam TTS returned no audio");
    }

    const audioBase64 = data.audios[0];
    const audioBuffer = Buffer.from(audioBase64, "base64");

    const estimatedDurationMs = Math.max(1000, text.length * 60);

    return {
      audioBuffer,
      format: "audio/wav",
      durationMs: estimatedDurationMs,
    };
  }
}
