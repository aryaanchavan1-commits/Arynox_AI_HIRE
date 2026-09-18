export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-invert space-y-6 text-surface-300 text-sm leading-relaxed">
          <section><h2 className="text-xl font-semibold text-white mb-3">Data Collection</h2><p>ARYNOX AI HIRE collects data necessary for the hiring process including: name, email, CV content, interview recordings (with consent), assessment responses, and GitHub repository data (when connected).</p></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">Camera & Microphone</h2><p>Camera and microphone access is requested only during AI interviews with your explicit consent. We do not secretly record or monitor candidates. Camera data is used for proctoring signals only (face presence, tab visibility) and is not stored permanently.</p></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">AI Processing</h2><p>Interview responses are processed by AI models (Groq, OpenAI, or Anthropic) to generate assessments. AI-generated scores are recommendations only and require human review before any hiring decision.</p></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">Data Retention</h2><p>Candidate data is retained for the duration of the hiring process. You may request deletion of your data at any time by contacting the organization.</p></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2><p>You have the right to access, correct, or delete your personal data. You may also request a copy of all data we hold about you.</p></section>
        </div>
      </div>
    </div>
  );
}
