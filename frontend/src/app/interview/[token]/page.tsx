"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ConsentScreen } from "@/components/interview/consent-screen";
import { SystemCheck } from "@/components/interview/system-check";
import { InterviewRoom } from "@/components/interview/interview-room";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Bot, CheckCircle2, X } from "lucide-react";
import { apiFetch } from "@/lib/utils";

type FlowStep = "loading" | "invalid" | "consent" | "system_check" | "interview" | "completed";

interface InterviewData {
  id: string;
  status: string;
  candidate_id: string;
  language: string;
  max_duration_minutes: number;
  jobs: { title: string; required_skills: string[] } | null;
  candidates: { name: string; email: string } | null;
}

export default function CandidateInterviewPage() {
  const params = useParams();
  const token = params?.token as string;
  const [step, setStep] = useState<FlowStep>("loading");
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStep("invalid");
      return;
    }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await apiFetch(`/api/interviews/validate-token/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid interview link");
        setStep("invalid");
        return;
      }
      const data = await res.json();
      setInterviewData(data.interview);
      setStep("consent");
    } catch {
      setError("Failed to validate interview link");
      setStep("invalid");
    }
  };

  const handleConsent = async (consented: boolean) => {
    if (!consented) return;
    try {
      const res = await apiFetch(`/api/interviews/join/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to join interview");
        setStep("invalid");
        return;
      }
      const data = await res.json();
      setInterviewData((prev) => prev ? { ...prev, id: data.interviewId, candidate_id: data.candidateId } : null);
      setStep("system_check");
    } catch {
      setError("Failed to join interview");
      setStep("invalid");
    }
  };

  const handleSystemCheckComplete = () => {
    setStep("interview");
  };

  const handleInterviewEnd = () => {
    setStep("completed");
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-brand-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Validating interview link...</p>
        </div>
      </div>
    );
  }

  if (step === "invalid") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mx-auto mb-4">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Invalid Link</h1>
            <p className="mt-2 text-sm text-gray-500">{error || "This interview link is invalid or has expired."}</p>
            <p className="mt-4 text-xs text-gray-400">Please contact your recruiter for a new link.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Interview Complete</h1>
            <p className="mt-2 text-sm text-gray-500">
              Thank you for completing the interview. Your results will be reviewed by the hiring team.
            </p>
            <p className="mt-4 text-xs text-gray-400">You may close this window.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "consent" && interviewData) {
    return (
      <ConsentScreen
        jobTitle={interviewData.jobs?.title || "Technical Interview"}
        language={interviewData.language}
        onConsent={handleConsent}
      />
    );
  }

  if (step === "system_check") {
    return <SystemCheck onComplete={handleSystemCheckComplete} />;
  }

  if (step === "interview" && interviewData) {
    return (
      <InterviewRoom
        interviewId={interviewData.id}
        candidateId={interviewData.candidate_id}
        invitationToken={token}
        jobTitle={interviewData.jobs?.title || "Technical Interview"}
        language={interviewData.language as "en" | "hi" | "mr"}
        maxDurationMinutes={interviewData.max_duration_minutes}
        onEnd={handleInterviewEnd}
      />
    );
  }

  return null;
}
