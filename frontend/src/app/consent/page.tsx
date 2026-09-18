export default function ConsentPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold mb-8">Interview Consent</h1>
        <div className="prose prose-invert space-y-6 text-surface-300 text-sm leading-relaxed">
          <section><h2 className="text-xl font-semibold text-white mb-3">What We Collect</h2><ul className="list-disc pl-6 space-y-2"><li>Camera feed during interview (for proctoring signals only)</li><li>Microphone input (for speech-to-text transcription)</li><li>Screen/tab visibility (for proctoring signals)</li><li>Interview responses and transcript</li></ul></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">How It&apos;s Used</h2><ul className="list-disc pl-6 space-y-2"><li>AI processes your spoken answers for technical evaluation</li><li>Proctoring signals are recorded as timestamps, not video</li><li>Transcript is used for generating interview reports</li><li>Data is shared only with the hiring organization</li></ul></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">Your Consent</h2><p>By proceeding with the interview, you consent to the collection and processing described above. You may withdraw consent at any time by ending the interview.</p></section>
        </div>
        <div className="mt-8 flex gap-4">
          <button className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">I Consent — Start Interview</button>
          <button className="rounded-lg border border-white/10 px-6 py-2.5 text-sm font-medium text-surface-300 hover:bg-white/5">Decline</button>
        </div>
      </div>
    </div>
  );
}
