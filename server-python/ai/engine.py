"""Interview Brain — manages the AI conversation state machine."""
from __future__ import annotations
import json
import random
import re
from datetime import datetime, timezone
from typing import Any, Optional
from providers import LLMProvider, STTProvider, TTSProvider
from providers import get_llm_provider, get_stt_provider, get_tts_provider
import config


PERSONA_EN = """You are ARYNOX AI Interviewer — a professional, calm, and technically rigorous AI conducting a technical interview.

PERSONALITY:
- Professional, calm, friendly, technically rigorous, neutral, respectful
- You speak naturally like a real recruiter, not a robot
- You acknowledge good answers before moving on
- You ask follow-ups that dig deeper into the candidate's experience
- You reference the candidate's CV, projects, and GitHub when available
- You adapt difficulty based on candidate responses
- Keep responses concise (2-4 sentences max for questions)
- Never fabricate repository facts

RULES:
- Ask ONE question at a time
- After the candidate answers, briefly acknowledge, then ask the next question
- If the candidate's answer is vague, ask for specifics
- If the candidate mentions a project, ask about architecture decisions, trade-offs, challenges
- If the candidate struggles, offer encouragement and simplify
- Use natural transitions: "Interesting. Let me ask about...", "Good point. Now tell me about..."
- Support code-mixing if the candidate uses Hindi/Marathi words"""

PERSONA_HI = """तुम ARYNOX AI Interviewer आहात — एक व्यावसायिक, शांत, आणि तांत्रिकदृष्ट्या कडक AI interview conduct करत आहात.

नियम:
- एका वेळी एकच प्रश्न विचारा
- Candidate चे उत्तर मान्य करा, तर पुढचा प्रश्न विचारा
- Natural भाषेत बोला — रोबोट सारखे नाही
- Technical शब्द English मध्ये ठेवा
- उत्तर अस्पष्ट असल्यास स्पष्टीकरण मागा"""

PERSONA_MR = """तुम्ही ARYNOX AI Interviewer आहात — एक व्यावसायिक, शांत, आणि तांत्रिकदृष्ट्या कडक AI interview घेत आहात.

नियम:
- एका वेळी एकच प्रश्न विचारा
- Candidate चे उत्तर मान्य करा, तर पुढचा प्रश्न विचारा
- Natural भाषेत बोला
- Technical शब्द English मध्ये ठेवा"""


class InterviewState:
    IDLE = "idle"
    LISTENING = "listening"
    THINKING = "thinking"
    SPEAKING = "speaking"
    INTERRUPTED = "interrupted"
    COMPLETED = "completed"
    ERROR = "error"


class InterviewBrain:
    def __init__(
        self,
        job_context: dict,
        candidate_context: dict,
        language: str = "en",
        max_questions: int = 10,
    ):
        self.job_context = job_context
        self.candidate_context = candidate_context
        self.language = language
        self.max_questions = max_questions

        self.llm: LLMProvider = get_llm_provider()
        self.stt: STTProvider = get_stt_provider()
        self.tts: TTSProvider = get_tts_provider()

        self.state = InterviewState.IDLE
        self.question_count = 0
        self.messages: list[dict[str, str]] = []
        self.transcript: list[dict] = []
        self.current_question: str = ""
        self.current_skill: str = ""
        self.conversation_history: list[dict] = []
        self._last_evaluation: Optional[dict[str, Any]] = None
        self._build_system_prompt()

    def _build_system_prompt(self):
        persona = PERSONA_EN
        if self.language == "hi":
            persona = PERSONA_HI
        elif self.language == "mr":
            persona = PERSONA_MR

        context_parts = [persona, ""]

        if self.job_context:
            context_parts.append(f"JOB: {self.job_context.get('title', 'Technical Role')}")
            skills = self.job_context.get("required_skills", [])
            if skills:
                context_parts.append(f"Required skills: {', '.join(skills)}")
            desc = self.job_context.get("description", "")
            if desc:
                context_parts.append(f"Job description: {desc}")

        if self.candidate_context:
            name = self.candidate_context.get("name", "the candidate")
            context_parts.append(f"\nCANDIDATE: {name}")
            skills = self.candidate_context.get("skills", [])
            if skills:
                context_parts.append(f"Skills: {', '.join(skills)}")
            exp = self.candidate_context.get("experience", "")
            if exp:
                context_parts.append(f"Experience: {exp}")

        context_parts.append(f"\nThis is interview question #{self.question_count + 1} of {self.max_questions}.")
        context_parts.append("Respond with a natural, conversational interview question. Do not use numbered lists.")

        self.messages = [{"role": "system", "content": "\n".join(context_parts)}]

    async def start(self) -> dict[str, Any]:
        """Start the interview — generate the first greeting + question."""
        self.state = InterviewState.THINKING

        greeting = self._get_greeting()
        self.messages.append({"role": "assistant", "content": greeting})

        self.question_count += 1
        self.current_question = greeting
        self.current_skill = "general"

        self.state = InterviewState.SPEAKING
        return {
            "type": "welcome",
            "text": greeting,
            "skill": "general",
            "difficulty": 1,
            "question_number": 1,
            "total_questions": self.max_questions,
        }

    async def process_answer(self, answer: str, audio_level: float = 0) -> dict[str, Any]:
        """Process candidate's answer, generate feedback + next question."""
        self.state = InterviewState.THINKING

        # Record in transcript
        self.transcript.append({
            "role": "candidate",
            "content": answer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        self.messages.append({"role": "user", "content": answer})

        # Generate response via LLM
        try:
            response_text = await self.llm.generate(self.messages, temperature=0.7, max_tokens=512)
        except Exception:
            response_text = self._fallback_response(answer)

        self.messages.append({"role": "assistant", "content": response_text})
        self.conversation_history.append({"role": "candidate", "content": answer})
        self.conversation_history.append({"role": "interviewer", "content": response_text})

        self.question_count += 1
        self.current_question = response_text

        # Record AI response in transcript
        self.transcript.append({
            "role": "ai",
            "content": response_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "skill": self.current_skill,
        })

        # Determine if interview is complete
        is_complete = self.question_count >= self.max_questions

        if is_complete:
            self.state = InterviewState.COMPLETED
            completion_msg = "Thank you for your time! That concludes our interview. We'll be in touch soon."
            self.transcript.append({
                "role": "ai",
                "content": completion_msg,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            evaluation = await self._generate_evaluation()
            self._last_evaluation = evaluation
            return {
                "type": "complete",
                "text": completion_msg,
                "evaluation": evaluation,
            }

        self.state = InterviewState.SPEAKING
        return {
            "type": "question",
            "text": response_text,
            "skill": self.current_skill,
            "difficulty": min(5, max(1, self.question_count // 2 + 1)),
            "question_number": self.question_count,
            "total_questions": self.max_questions,
        }

    async def on_interruption(self) -> dict[str, Any]:
        """Handle candidate interrupting while AI is speaking."""
        self.state = InterviewState.INTERRUPTED
        # Short acknowledgement
        ack = random.choice(["Go ahead.", "Sure, go on.", "Please continue.", "I'm listening."])
        self.state = InterviewState.LISTENING
        return {"type": "acknowledgement", "text": ack}

    async def transcribe_audio(self, audio_data: bytes) -> dict:
        """Transcribe candidate audio via STT provider."""
        result = await self.stt.transcribe(audio_data, self.language)
        return result

    def set_listening(self):
        self.state = InterviewState.LISTENING

    def set_speaking(self):
        self.state = InterviewState.SPEAKING

    def is_complete(self) -> bool:
        return self.question_count >= self.max_questions

    def _get_greeting(self) -> str:
        name = self.candidate_context.get("name", "")
        job = self.job_context.get("title", "this position")
        skills = self.job_context.get("required_skills", [])

        if self.language == "hi":
            greeting = f"नमस्ते{' ' + name if name else ''}! मैं ARYNOX AI Interviewer हूँ। आज हम {job} के पद के लिए तकनीकी interview करेंगे।"
            if skills:
                greeting += f" मुख्य रूप से {', '.join(skills[:3])} पर ध्यान देंगे।"
            greeting += " चलिए शुरू करते हैं। कृपया अपने बारे में बताएं।"
        elif self.language == "mr":
            greeting = f"नमस्कार{' ' + name if name else ''}! मी ARYNOX AI Interviewer आहे। आज आपण {job} पदासाठी तांत्रिक interview घेणार आहोत।"
            if skills:
                greeting += f" प्रमुखरित्या {', '.join(skills[:3])} वर लक्ष केंद्रित करणार आहोत।"
            greeting += " सुरू करूया. कृपया तुमच्याबद्दल सांगा."
        else:
            greeting = f"Hello{' ' + name if name else ''}! I'm your AI interviewer from ARYNOX AI HIRE. Today we'll be conducting a technical interview for the {job} position."
            if skills:
                greeting += f" I'll be focusing on {', '.join(skills[:3])}."
            greeting += " Let's get started. Could you briefly introduce yourself and your experience?"

        return greeting

    def _fallback_response(self, answer: str) -> str:
        """Generate a fallback response when LLM fails."""
        fallbacks = [
            "Thank you for that answer. Let me ask you about your technical skills.",
            "Interesting. Can you tell me more about your project experience?",
            "Good. Let's move to a technical question. Can you explain a concept you're comfortable with?",
            "I see. What's a challenging problem you've solved recently?",
        ]
        return random.choice(fallbacks)

    async def _generate_evaluation(self) -> dict[str, Any]:
        """Generate final evaluation from the actual transcript.
        Uses the LLM when available; falls back to a deterministic transcript-based
        heuristic so results are stable and reproducible (never random)."""
        # Ask the LLM for an evidence-based evaluation of the real conversation
        if len(self.transcript) > 0:
            transcript_text = "\n".join(
                f"{t['role'].upper()}: {t['content']}" for t in self.transcript
            )
            eval_messages = [
                {"role": "system", "content": PERSONA_EN + "\n\nYou are now scoring the interview. Be fair, evidence-based, and consistent."},
                {"role": "user", "content": (
                    "Interview transcript:\n" + transcript_text[:8000] +
                    "\n\nScore the candidate 0-100 on each dimension based ONLY on evidence in the transcript. "
                    "Respond with ONLY a JSON object, no other text:\n"
                    '{"technical_score": <0-100>, "communication_score": <0-100>, '
                    '"problem_solving_score": <0-100>, "project_understanding_score": <0-100>, '
                    '"strengths": ["..."], "improvements": ["..."], "summary": "..."}'
                )},
            ]
            try:
                raw = await self.llm.generate(eval_messages, temperature=0.2, max_tokens=800)
                match = re.search(r"\{[\s\S]*\}", raw)
                if match:
                    data = json.loads(match.group(0))
                    return self._normalize_evaluation(data)
            except Exception:
                pass  # fall through to deterministic fallback

        return self._deterministic_evaluation()

    def _deterministic_evaluation(self) -> dict[str, Any]:
        """Deterministic transcript-based fallback (no randomness — same input, same scores)."""
        answers = [t["content"] for t in self.transcript if t.get("role") == "candidate"]
        n_answers = len(answers)

        if n_answers == 0:
            return self._normalize_evaluation({
                "technical_score": 0, "communication_score": 0,
                "problem_solving_score": 0, "project_understanding_score": 0,
                "strengths": [],
                "improvements": ["No answers recorded during the interview"],
                "summary": "The candidate did not provide any answers, so no evaluation could be made.",
            })

        total_chars = sum(len(a) for a in answers)
        avg_len = total_chars / n_answers

        # Depth signal: longer, more detailed answers generally indicate deeper engagement
        depth = min(1.0, avg_len / 400)                      # 400+ chars ≈ detailed
        effort = min(1.0, total_chars / 1500)                # overall participation
        technical_terms = (
            "implement", "architecture", "database", "api", "framework", "optimize",
            "testing", "deployment", "algorithm", "performance", "security", "scale",
        )
        term_hits = sum(1 for a in answers for t in technical_terms if t in a.lower())
        specificity = min(1.0, term_hits / max(4, n_answers))

        base = 40 + 35 * depth + 15 * specificity + 10 * effort
        scores = {
            "technical_score": round(min(100, base + 5 * specificity)),
            "communication_score": round(min(100, base + 5 * depth)),
            "problem_solving_score": round(min(100, base)),
            "project_understanding_score": round(min(100, base - 5 + 10 * depth)),
        }

        strengths = []
        improvements = []
        if depth > 0.5:
            strengths.append("Provided detailed, well-developed answers")
        else:
            improvements.append("Answers were brief — expand with concrete examples")
        if specificity > 0.4:
            strengths.append("Used specific technical vocabulary and concepts")
        else:
            improvements.append("Cite specific technologies and methods when answering")
        if n_answers >= self.max_questions - 1:
            strengths.append("Completed the full interview")
        if not strengths:
            strengths.append("Participated in the interview")
        if not improvements:
            improvements.append("Continue building depth in technical communication")

        return self._normalize_evaluation({
            **scores,
            "strengths": strengths,
            "improvements": improvements,
            "summary": (
                f"The candidate answered {n_answers} question(s) with an average length of "
                f"{int(avg_len)} characters. Scores are derived from answer depth, technical "
                f"specificity, and participation."
            ),
        })

    def _normalize_evaluation(self, data: dict[str, Any]) -> dict[str, Any]:
        """Clamp/validate an evaluation dict to a consistent, safe shape."""
        def clamp_score(val: Any) -> int:
            try:
                return max(0, min(100, int(round(float(val)))))
            except (TypeError, ValueError):
                return 0

        scores = {
            "technical_score": clamp_score(data.get("technical_score", 0)),
            "communication_score": clamp_score(data.get("communication_score", 0)),
            "problem_solving_score": clamp_score(data.get("problem_solving_score", 0)),
            "project_understanding_score": clamp_score(data.get("project_understanding_score", 0)),
        }
        overall = round(sum(scores.values()) / 4)

        strengths = [str(s) for s in (data.get("strengths") or [])][:8]
        improvements = [str(s) for s in (data.get("improvements") or [])][:8]
        summary = str(data.get("summary") or "Evaluation completed.")[:2000]

        return {
            **scores,
            "overall_score": overall,
            "strengths": strengths,
            "improvements": improvements,
            "summary": summary,
        }

    def get_state(self) -> dict:
        return {
            "state": self.state,
            "question_count": self.question_count,
            "max_questions": self.max_questions,
            "current_question": self.current_question,
            "language": self.language,
        }
