export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-white py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-invert space-y-6 text-surface-300 text-sm leading-relaxed">
          <section><h2 className="text-xl font-semibold text-white mb-3">Service Description</h2><p>ARYNOX AI HIRE provides AI-powered technical hiring tools including automated interviews, assessments, and candidate evaluation.</p></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">AI Disclaimer</h2><p>All AI-generated assessments, scores, and recommendations are advisory in nature. Hiring decisions must be made by qualified humans. ARYNOX AI HIRE does not make automated employment decisions.</p></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">Fairness</h2><p>Our AI systems are designed to evaluate candidates based on technical skills and job-related competencies only. The system does not evaluate candidates based on race, religion, gender, caste, political beliefs, appearance, accent, or other irrelevant characteristics.</p></section>
          <section><h2 className="text-xl font-semibold text-white mb-3">Limitation of Liability</h2><p>ARYNOX AI HIRE provides tools to assist in hiring. We are not liable for hiring decisions made based on AI recommendations.</p></section>
        </div>
      </div>
    </div>
  );
}
