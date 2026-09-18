import { LLMProvider, LLMMessage, LLMResponse } from "../types.js";

export class MockLLMProvider implements LLMProvider {
  name = "mock";

  isAvailable(): boolean {
    return true;
  }

  async chat(messages: LLMMessage[], options = {}): Promise<LLMResponse> {
    const lastMsg = messages[messages.length - 1]?.content || "";
    const mockResponses: Record<string, string> = {
      default: "This is a mock response from ARYNOX AI HIRE in local mode. In production, this would be a real AI response from Groq/OpenAI/Anthropic.",
      introduction: "Hello! I'm the AI interviewer from ARYNOX AI HIRE. I'll be conducting your technical interview today. Let me start by asking about your experience.",
      technical: "That's a good answer. Can you explain the difference between a stack and a queue, and give me a real-world example of when you'd use each?",
      project: "I can see from your GitHub that you've worked with React and TypeScript. Can you walk me through the architecture of your most recent project?",
    };

    const lowerMsg = lastMsg.toLowerCase();
    let response = mockResponses.default;
    if (lowerMsg.includes("introduction") || lowerMsg.includes("start")) response = mockResponses.introduction;
    else if (lowerMsg.includes("technical") || lowerMsg.includes("code")) response = mockResponses.technical;
    else if (lowerMsg.includes("project") || lowerMsg.includes("github")) response = mockResponses.project;

    await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));

    return {
      content: response,
      provider: "mock",
      model: "mock-1.0",
      tokens: { prompt: 50, completion: 80, total: 130 },
      latencyMs: 500,
    };
  }
}
