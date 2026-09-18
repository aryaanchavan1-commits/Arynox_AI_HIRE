"""Mock LLM provider for local mode."""
from __future__ import annotations
import random
from providers import LLMProvider

PERSONA = """You are ARYNOX AI Interviewer — a professional, calm, and technically rigorous AI conducting a technical interview.

Rules:
- Ask natural, conversational questions — not robotic lists.
- Reference the candidate's CV, projects, and GitHub when available.
- Acknowledge good answers before moving on.
- Ask follow-ups that dig deeper.
- Adapt difficulty based on candidate responses.
- Support code-mixing (English + Hindi/Marathi) when the candidate does.
- Keep responses concise (2-4 sentences max for questions).
- Never fabricate repository facts. If evidence is unavailable, treat claims as unverified.
- Be respectful, neutral, and professional.
- Do not judge appearance, accent, or protected characteristics."""

NATURAL_QUESTIONS = [
    ("general", "Hi! I'm your AI interviewer from ARYNOX. Before we begin, could you briefly introduce yourself and tell me about your background?"),
    ("general", "That's interesting. What motivated you to get into this field?"),
    ("technical", "Can you explain the difference between `var`, `let`, and `const` in JavaScript?"),
    ("technical", "How do React hooks work? Walk me through `useState` and `useEffect` with a real example from your experience."),
    ("technical", "What happens under the hood when you call `setState` in React?"),
    ("architecture", "You mentioned you worked on a {project}. Can you walk me through the architecture and why you made those choices?"),
    ("architecture", "If you had to redesign that system today, what would you do differently and why?"),
    ("problem_solving", "How would you optimize a React app that's re-rendering excessively? Walk me through your debugging approach."),
    ("system_design", "Design a real-time notification system. How would you handle WebSocket connections, message ordering, and offline support?"),
    ("security", "How would you implement secure authentication in a Next.js app? Discuss JWT, sessions, and OAuth trade-offs."),
    ("performance", "What's the difference between `debounce` and `throttle`? When would you use each?"),
    ("technical", "Explain the virtual DOM and React's reconciliation algorithm. How does it determine what to re-render?"),
    ("testing", "What's your approach to testing React components? Walk me through unit, integration, and e2e testing strategies."),
    ("technical", "What is closure in JavaScript? Can you give a practical example of when you'd use it?"),
    ("architecture", "How do you decide between REST and GraphQL for a new project?"),
]

FOLLOWUPS = [
    "That's a solid answer. Can you go deeper on the technical details?",
    "Interesting approach. What trade-offs did you consider?",
    "Good explanation. How would you handle edge cases there?",
    "Makes sense. Can you give me a specific example from your project?",
    "I see. What would you do differently if you had to redo that?",
    "Nice. How did you test that approach?",
    "Fair enough. What challenges did you face implementing that?",
]

ACKNOWLEDGEMENTS = [
    "Good answer. Let me ask about something else.",
    "That makes sense. I'd like to explore another area.",
    "Interesting. Let's move to a different topic.",
    "Thanks for that explanation. Here's my next question.",
    "I appreciate the detail. Let me ask you about something related.",
]


class MockLLMProvider(LLMProvider):
    def __init__(self):
        self._question_index = 0

    async def generate(self, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        # Look at conversation history to decide what to say next
        if not messages or len(messages) <= 1:
            skill, question = NATURAL_QUESTIONS[0]
            return question

        last_msg = messages[-1].get("content", "").lower()

        # Check if this is an answer to a question
        if any(kw in last_msg for kw in ["built", "developed", "created", "implemented", "worked on", "experience", "project"]):
            return random.choice(FOLLOWUPS + ACKNOWLEDGEMENTS)

        # Advance to next question
        self._question_index = min(self._question_index + 1, len(NATURAL_QUESTIONS) - 1)
        skill, question = NATURAL_QUESTIONS[self._question_index]
        return question

    async def generate_stream(self, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024):
        response = await self.generate(messages, temperature, max_tokens)
        # Simulate streaming sentence by sentence
        sentences = response.replace(". ", ".|").split("|")
        for s in sentences:
            if s.strip():
                yield s.strip() + " "
