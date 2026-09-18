import { LLMMessage, InterviewQuestion, InterviewEvaluation } from "./types.js";
import { getLLMProvider } from "./llm/index.js";
import { z } from "zod";
import { logger } from "../utils/logger.js";

const questionSchema = z.object({
  question: z.string(),
  skill: z.string(),
  difficulty: z.number().min(1).max(5),
  question_type: z.enum(["technical", "project_defense", "problem_solving", "system_design", "hr"]),
  expected_concepts: z.array(z.string()),
  follow_up: z.boolean(),
  language: z.enum(["en", "hi", "mr"]),
});

export class InterviewEngine {
  private provider = getLLMProvider();
  private messages: LLMMessage[] = [];
  private questionCount = 0;
  private maxQuestions = 15;

  constructor(
    private jobContext: any,
    private candidateContext: any,
    private language: "en" | "hi" | "mr" = "en",
    private ragContext: string = "",
  ) {
    this.messages.push({
      role: "system",
      content: this.buildSystemPrompt(),
    });
  }

  private buildSystemPrompt(): string {
    const langMap = { en: "English", hi: "Hindi", mr: "Marathi" };
    return `You are an expert AI technical interviewer for ARYNOX AI HIRE.
Conduct a professional technical interview in ${langMap[this.language]}.

JOB CONTEXT:
${JSON.stringify(this.jobContext, null, 2)}

CANDIDATE CONTEXT:
${JSON.stringify(this.candidateContext, null, 2)}

${this.ragContext ? `COMPANY KNOWLEDGE:\n${this.ragContext}\n` : ""}

RULES:
1. Ask ONE question at a time
2. Be professional and respectful
3. Evaluate answers based on technical evidence
4. Never discriminate based on race, religion, gender, caste, or appearance
5. Adapt difficulty based on candidate responses
6. Focus on job-relevant skills only
7. Respond in ${langMap[this.language]}
8. Keep responses concise

When generating a question, output it in this JSON format:
{"question":"...","skill":"...","difficulty":1-5,"question_type":"technical|project_defense|problem_solving|system_design|hr","expected_concepts":["..."],"follow_up":false,"language":"${this.language}"}`;
  }

  async generateQuestion(): Promise<InterviewQuestion> {
    const stage = this.questionCount === 0 ? "INTRODUCTION" :
      this.questionCount <= 4 ? "TECHNICAL" :
      this.questionCount <= 8 ? "PROJECT" :
      this.questionCount <= 12 ? "PROBLEM_SOLVING" : "HR";

    const prompt = this.questionCount === 0
      ? "Introduce yourself briefly and ask the first technical question."
      : `Generate the next ${stage} stage question. Be concise.`;

    this.messages.push({ role: "user", content: prompt });
    const response = await this.provider.chat(this.messages, { temperature: 0.7 });
    this.messages.push({ role: "assistant", content: response.content });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        this.questionCount++;
        return questionSchema.parse({ ...parsed, language: this.language });
      }
    } catch (e) {
      logger.warn("Failed to parse question JSON, using fallback");
    }

    this.questionCount++;
    return {
      question: response.content || "Tell me about your experience.",
      skill: "general",
      difficulty: 3,
      question_type: "technical",
      expected_concepts: [],
      follow_up: false,
      language: this.language,
    };
  }

  async evaluateAnswer(answer: string, question: InterviewQuestion): Promise<string> {
    const prompt = `The candidate answered: "${answer}"\nQuestion was about ${question.skill}.\nProvide brief feedback and a follow-up question if needed. Be concise.`;
    this.messages.push({ role: "user", content: prompt });
    const response = await this.provider.chat(this.messages, { temperature: 0.5 });
    this.messages.push({ role: "assistant", content: response.content });
    return response.content;
  }

  async generateFinalEvaluation(): Promise<InterviewEvaluation> {
    const prompt = `Generate a final evaluation of the candidate based on the interview. Output JSON:
{"technical_score":0-100,"communication_score":0-100,"problem_solving_score":0-100,"project_understanding_score":0-100,"evidence":["..."],"missing_concepts":["..."],"strengths":["..."],"improvements":["..."],"confidence":0.0-1.0,"summary":"..."}`;
    this.messages.push({ role: "user", content: prompt });
    const response = await this.provider.chat(this.messages, { temperature: 0.3 });

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) {}

    return {
      technical_score: 70, communication_score: 70, problem_solving_score: 70, project_understanding_score: 70,
      evidence: [], missing_concepts: [], strengths: [], improvements: [],
      confidence: 0.5, summary: "Evaluation generated in mock mode.",
    };
  }

  isComplete(): boolean {
    return this.questionCount >= this.maxQuestions;
  }
}
