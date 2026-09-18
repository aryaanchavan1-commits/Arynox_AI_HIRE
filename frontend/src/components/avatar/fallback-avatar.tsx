"use client";

import { motion } from "framer-motion";
import { AvatarState } from "./types";
import { Bot, Loader2, Mic, AlertCircle, CheckCircle2 } from "lucide-react";

interface FallbackAvatarProps {
  state: AvatarState;
  name?: string;
}

const stateConfig: Record<AvatarState, { color: string; icon: typeof Bot; label: string }> = {
  idle: { color: "from-brand-500 to-blue-500", icon: Bot, label: "AI Interviewer" },
  listening: { color: "from-green-500 to-emerald-500", icon: Mic, label: "Listening..." },
  thinking: { color: "from-yellow-500 to-orange-500", icon: Loader2, label: "Thinking..." },
  speaking: { color: "from-brand-500 to-purple-500", icon: Bot, label: "Speaking..." },
  interrupted: { color: "from-orange-500 to-amber-500", icon: Mic, label: "Interrupted" },
  success: { color: "from-green-500 to-teal-500", icon: CheckCircle2, label: "Great!" },
  error: { color: "from-red-500 to-rose-500", icon: AlertCircle, label: "Error" },
};

export function FallbackAvatar({ state, name = "AI Interviewer" }: FallbackAvatarProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.02, 1] : state === "thinking" ? [1, 0.98, 1] : 1,
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className={`flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br ${config.color} shadow-2xl`}
      >
        <Icon className={`h-20 w-20 text-white ${state === "thinking" ? "animate-spin" : ""}`} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center"
      >
        <p className="text-lg font-semibold text-white">{name}</p>
        <p className="mt-1 text-sm text-surface-400">{config.label}</p>
      </motion.div>
      {state === "thinking" && (
        <div className="mt-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="h-2 w-2 rounded-full bg-brand-400"
            />
          ))}
        </div>
      )}
    </div>
  );
}
