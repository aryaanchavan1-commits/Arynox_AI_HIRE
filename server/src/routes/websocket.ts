import { FastifyInstance } from "fastify";
import { InterviewEngine } from "../ai/interview-engine.js";
import { supabaseAdmin } from "../database/client.js";
import { logger } from "../utils/logger.js";

const activeSessions = new Map<string, {
  engine: InterviewEngine;
  candidateId: string;
  interviewId: string;
  language: "en" | "hi" | "mr";
}>();

export async function registerWebSocketRoutes(app: FastifyInstance) {
  app.get("/ws/interview/:sessionId", { websocket: true }, (socket, request) => {
    const { sessionId } = request.params as { sessionId: string };
    logger.info(`WebSocket connected: ${sessionId}`);

    socket.send(JSON.stringify({ type: "connection", sessionId, status: "connected" }));

    socket.on("message", async (raw: Buffer | string) => {
      try {
        const message = JSON.parse(raw.toString());

        switch (message.type) {
          case "join": {
            const { interviewId, candidateId } = message.payload || message;
            const { data: interview } = await supabaseAdmin
              .from("interviews")
              .select("*, jobs(*), candidates(*)")
              .eq("id", interviewId)
              .single();

            if (!interview) {
              socket.send(JSON.stringify({ type: "error", payload: { message: "Interview not found" } }));
              return;
            }

            const engine = new InterviewEngine(
              interview.jobs || {},
              interview.candidates || {},
              interview.language || "en",
              "",
            );

            activeSessions.set(sessionId, {
              engine,
              candidateId: candidateId || interview.candidate_id,
              interviewId,
              language: (interview.language || "en") as "en" | "hi" | "mr",
            });

            const question = await engine.generateQuestion();
            socket.send(JSON.stringify({
              type: "welcome",
              payload: {
                question: question.question,
                skill: question.skill,
                difficulty: question.difficulty,
                questionType: question.question_type,
              },
            }));

            await supabaseAdmin.from("interview_events").insert({
              interview_id: interviewId,
              event_type: "question",
              payload: question,
              timestamp: new Date().toISOString(),
            });
            break;
          }

          case "answer": {
            const session = activeSessions.get(sessionId);
            if (!session) {
              socket.send(JSON.stringify({ type: "error", payload: { message: "No active session" } }));
              return;
            }

            await supabaseAdmin.from("interview_events").insert({
              interview_id: session.interviewId,
              event_type: "answer",
              payload: { answer: message.payload.answer, question: message.payload.question, skill: message.payload.skill },
              timestamp: new Date().toISOString(),
            });

            const feedback = await session.engine.evaluateAnswer(
              message.payload.answer,
              { question: message.payload.question, skill: message.payload.skill, difficulty: 3, question_type: "technical", expected_concepts: [], follow_up: false, language: session.language },
            );

            socket.send(JSON.stringify({
              type: "feedback",
              payload: { feedback },
            }));

            if (session.engine.isComplete()) {
              const evaluation = await session.engine.generateFinalEvaluation();
              await supabaseAdmin.from("interviews").update({
                status: "completed",
                completed_at: new Date().toISOString(),
                evaluation,
              }).eq("id", session.interviewId);

              socket.send(JSON.stringify({ type: "complete", payload: { evaluation } }));
              activeSessions.delete(sessionId);
            } else {
              const nextQuestion = await session.engine.generateQuestion();
              socket.send(JSON.stringify({
                type: "question",
                payload: {
                  question: nextQuestion.question,
                  skill: nextQuestion.skill,
                  difficulty: nextQuestion.difficulty,
                  questionType: nextQuestion.question_type,
                },
              }));

              await supabaseAdmin.from("interview_events").insert({
                interview_id: session.interviewId,
                event_type: "question",
                payload: nextQuestion,
                timestamp: new Date().toISOString(),
              });
            }
            break;
          }

          case "end": {
            const session = activeSessions.get(sessionId);
            if (session) {
              const evaluation = await session.engine.generateFinalEvaluation();
              await supabaseAdmin.from("interviews").update({
                status: "completed",
                completed_at: new Date().toISOString(),
                evaluation,
              }).eq("id", session.interviewId);

              socket.send(JSON.stringify({ type: "complete", payload: { evaluation } }));
              activeSessions.delete(sessionId);
            }
            break;
          }

          case "proctoring": {
            const session = activeSessions.get(sessionId);
            if (session) {
              await supabaseAdmin.from("interview_events").insert({
                interview_id: session.interviewId,
                event_type: "proctoring",
                payload: { event: message.payload.event, details: message.payload.details },
                timestamp: new Date().toISOString(),
              });
            }
            break;
          }

          default:
            socket.send(JSON.stringify({ type: "error", payload: { message: `Unknown type: ${message.type}` } }));
        }
      } catch (err) {
        logger.error(err, `WebSocket error [${sessionId}]`);
        socket.send(JSON.stringify({ type: "error", payload: { message: "Internal server error" } }));
      }
    });

    socket.on("close", () => {
      logger.info(`WebSocket disconnected: ${sessionId}`);
      activeSessions.delete(sessionId);
    });
  });
}
