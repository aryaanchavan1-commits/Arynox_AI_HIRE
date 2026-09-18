"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Eye, Mic, Camera, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";

interface ConsentScreenProps {
  jobTitle: string;
  language: string;
  onConsent: (consented: boolean) => void;
}

export function ConsentScreen({ jobTitle, language, onConsent }: ConsentScreenProps) {
  const [cameraConsent, setCameraConsent] = useState(false);
  const [micConsent, setMicConsent] = useState(false);
  const [faceConsent, setFaceConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);

  const allConsented = cameraConsent && micConsent && faceConsent && dataConsent;

  const handleAllowCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCameraConsent(true);
    } catch {
      alert("Camera access is required for this interview.");
    }
  };

  const handleAllowMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicConsent(true);
    } catch {
      alert("Microphone access is required for this interview.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Interview Consent</h1>
              <p className="text-sm text-gray-500">{jobTitle}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-600 leading-relaxed">
              Before starting, we need your consent for the following. All data is encrypted and only accessible to your hiring team.
            </p>

            <ConsentItem
              icon={<Camera className="h-4 w-4" />}
              title="Camera Access"
              description="Used for face detection and proctoring signals."
              checked={cameraConsent}
              onToggle={handleAllowCamera}
              required
            />
            <ConsentItem
              icon={<Mic className="h-4 w-4" />}
              title="Microphone Access"
              description="Required for voice-based interview interaction."
              checked={micConsent}
              onToggle={handleAllowMic}
              required
            />
            <ConsentItem
              icon={<Eye className="h-4 w-4" />}
              title="Face Presence Monitoring"
              description="We check if your face is visible. We never record or store video."
              checked={faceConsent}
              onToggle={() => setFaceConsent(!faceConsent)}
              required
            />
            <ConsentItem
              icon={<Shield className="h-4 w-4" />}
              title="Data Processing Consent"
              description="Your answers and assessment data will be stored for evaluation."
              checked={dataConsent}
              onToggle={() => setDataConsent(!dataConsent)}
              required
            />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Important</p>
                <p className="text-sm text-amber-700 mt-1">
                  Once you start, the interview timer will begin. You cannot pause or restart. Please ensure a stable internet connection.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onConsent(true)}
            disabled={!allConsented}
            className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 flex items-center justify-center gap-2"
          >
            Start System Check
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ConsentItem({ icon, title, description, checked, onToggle, required }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  required?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        checked ? "border-brand-200 bg-brand-50/50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${checked ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"}`}>
        {checked ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{title}</span>
          {required && <span className="text-xs text-gray-400">Required</span>}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
