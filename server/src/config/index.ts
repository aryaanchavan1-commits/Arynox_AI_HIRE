import dotenv from "dotenv";
dotenv.config();

function env(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

export const config = {
  NODE_ENV: env("NODE_ENV", "development"),
  APP_MODE: env("APP_MODE", "local"),
  PORT: parseInt(env("PORT", "8000"), 10),
  CORS_ORIGINS: [env("NEXT_PUBLIC_APP_URL", "http://localhost:3000")] as string[],
  LOG_LEVEL: env("LOG_LEVEL", "info"),

  SUPABASE_URL: env("SUPABASE_URL"),
  SUPABASE_ANON_KEY: env("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: env("SUPABASE_SERVICE_ROLE_KEY"),
  DATABASE_URL: env("DATABASE_URL"),

  GROQ_API_KEY: env("GROQ_API_KEY"),
  OPENAI_API_KEY: env("OPENAI_API_KEY"),
  ANTHROPIC_API_KEY: env("ANTHROPIC_API_KEY"),
  LLM_PROVIDER: env("LLM_PROVIDER", "groq"),

  STT_API_KEY: env("STT_API_KEY"),
  TTS_API_KEY: env("TTS_API_KEY"),
  STT_PROVIDER: env("STT_PROVIDER", "sarvam"),
  TTS_PROVIDER: env("TTS_PROVIDER", "sarvam"),

  TAVUS_API_KEY: env("TAVUS_API_KEY"),
  TAVUS_DEFAULT_FACE_ID: env("TAVUS_DEFAULT_FACE_ID", ""),

  LIVEKIT_URL: env("LIVEKIT_URL", "ws://localhost:7880"),
  LIVEKIT_API_KEY: env("LIVEKIT_API_KEY", "devkey"),
  LIVEKIT_API_SECRET: env("LIVEKIT_API_SECRET", "devsecret"),
  REALTIME_PROVIDER: env("REALTIME_PROVIDER", "websocket"),

  EMBEDDING_API_KEY: env("EMBEDDING_API_KEY"),
  EMBEDDING_PROVIDER: env("EMBEDDING_PROVIDER", "local"),

  GITHUB_CLIENT_ID: env("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: env("GITHUB_CLIENT_SECRET"),

  RAZORPAY_KEY_ID: env("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: env("RAZORPAY_KEY_SECRET"),

  RESEND_API_KEY: env("RESEND_API_KEY"),

  JWT_SECRET: env("JWT_SECRET", "dev-secret-change-in-production"),
};
