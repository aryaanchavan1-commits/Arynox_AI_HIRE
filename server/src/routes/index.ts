import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { jobsRoutes } from "./jobs.js";
import { candidatesRoutes } from "./candidates.js";
import { interviewsRoutes } from "./interviews.js";
import { assessmentsRoutes } from "./assessments.js";
import { projectsRoutes } from "./projects.js";
import { documentsRoutes } from "./documents.js";
import { reportsRoutes } from "./reports.js";
import { githubRoutes } from "./github.js";
import { billingRoutes } from "./billing.js";
import { usageRoutes } from "./usage.js";
import { ragRoutes } from "./rag.js";
import { registerWebSocketRoutes } from "./websocket.js";
import { avatarRoutes } from "./avatar.js";
import { voiceRoutes } from "./voice.js";
import { supabaseAdmin } from "../database/client.js";

export async function registerRoutes(app: FastifyInstance) {
  // Public routes (no auth)
  app.get("/api/health", async () => ({ status: "ok", api: "v1" }));

  // Candidate-facing routes (token-based, no auth middleware)
  app.get("/api/interviews/validate-token/:token", async (request, reply) => {
    const { token } = request.params as { token: string };
    const { data, error } = await supabaseAdmin
      .from("interviews")
      .select("id, status, invitation_expires_at, max_duration_minutes, language, candidates(name, email), jobs(title, required_skills)")
      .eq("invitation_token", token)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Invalid interview link" });
    if (new Date(data.invitation_expires_at) < new Date()) {
      return reply.status(410).send({ error: "This interview link has expired" });
    }
    if (data.status === "completed") {
      return reply.status(409).send({ error: "This interview has already been completed" });
    }
    return { valid: true, interview: data };
  });

  app.post("/api/interviews/join/:token", async (request, reply) => {
    const { token } = request.params as { token: string };
    const { data, error } = await supabaseAdmin
      .from("interviews")
      .select("id, status, invitation_expires_at, candidate_id")
      .eq("invitation_token", token)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Invalid interview link" });
    if (new Date(data.invitation_expires_at) < new Date()) {
      return reply.status(410).send({ error: "This interview link has expired" });
    }
    if (data.status === "completed" || data.status === "in_progress") {
      return reply.status(409).send({ error: "Interview already started or completed" });
    }

    await supabaseAdmin
      .from("interviews")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", data.id);

    return { interviewId: data.id, candidateId: data.candidate_id };
  });

  app.post("/api/interviews/:id/answer", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { answer, question, skill } = request.body as any;
    const { error } = await supabaseAdmin
      .from("interview_events")
      .insert({
        interview_id: id,
        event_type: "answer",
        payload: { answer, question, skill },
        timestamp: new Date().toISOString(),
      });
    if (error) return reply.status(500).send({ error: error.message });
    return { received: true };
  });

  app.post("/api/interviews/:id/complete", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { evaluation } = request.body as { evaluation?: any };
    const updateData: any = {
      status: "completed",
      completed_at: new Date().toISOString(),
    };
    if (evaluation) updateData.evaluation = evaluation;

    const { data, error } = await supabaseAdmin
      .from("interviews")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  app.get("/api/interviews/:id/events", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await supabaseAdmin
      .from("interview_events")
      .select("*")
      .eq("interview_id", id)
      .order("timestamp", { ascending: true });
    if (error) return reply.status(500).send({ error: error.message });
    return { events: data };
  });

  // Authenticated routes
  app.addHook("onRequest", async (req, reply) => {
    if (req.url.startsWith("/health") || req.url.startsWith("/docs")) return;
    if (req.url.startsWith("/api/")) {
      // Skip auth for public/candidate routes
      if (req.url.includes("/validate-token/") || req.url.includes("/join/")) return;
      if (req.url.match(/\/api\/interviews\/[^/]+\/(answer|complete|events)/)) return;
      await authMiddleware(req, reply);
    }
  });

  await app.register(jobsRoutes, { prefix: "/api/jobs" });
  await app.register(candidatesRoutes, { prefix: "/api/candidates" });
  await app.register(interviewsRoutes, { prefix: "/api/interviews" });
  await app.register(assessmentsRoutes, { prefix: "/api/assessments" });
  await app.register(projectsRoutes, { prefix: "/api/projects" });
  await app.register(documentsRoutes, { prefix: "/api/documents" });
  await app.register(reportsRoutes, { prefix: "/api/reports" });
  await app.register(githubRoutes, { prefix: "/api/github" });
  await app.register(billingRoutes, { prefix: "/api/billing" });
  await app.register(usageRoutes, { prefix: "/api/usage" });
  await app.register(ragRoutes, { prefix: "/api/rag" });
  await app.register(avatarRoutes, { prefix: "/api/avatar" });
  await app.register(voiceRoutes, { prefix: "/api/voice" });
  await registerWebSocketRoutes(app);
}
