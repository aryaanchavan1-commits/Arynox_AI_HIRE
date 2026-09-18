import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../database/client.js";
import crypto from "crypto";

const createInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),
  language: z.enum(["en", "hi", "mr"]).default("en"),
  type: z.enum(["technical", "project_defense", "hr", "comprehensive"]).default("comprehensive"),
  maxDurationMinutes: z.number().min(10).max(120).default(60),
});

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function interviewsRoutes(app: FastifyInstance) {
  // List interviews (authenticated, recruiter)
  app.get("/", async (request, reply) => {
    const user = (request as any).user;
    const { data, error } = await supabaseAdmin
      .from("interviews")
      .select("*, candidates(name, email), jobs(title)")
      .eq("organization_id", user.organizationId)
      .order("created_at", { ascending: false });
    if (error) return reply.status(500).send({ error: error.message });
    return { interviews: data };
  });

  // Get interview details
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await supabaseAdmin
      .from("interviews")
      .select("*, candidates(name, email, github_url), jobs(title, required_skills, description)")
      .eq("id", id)
      .single();
    if (error) return reply.status(404).send({ error: "Interview not found" });
    return data;
  });

  // Create interview (authenticated, recruiter)
  app.post("/", async (request, reply) => {
    const user = (request as any).user;
    const parsed = createInterviewSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from("interviews")
      .insert({
        candidate_id: parsed.data.candidateId,
        job_id: parsed.data.jobId,
        language: parsed.data.language,
        type: parsed.data.type,
        max_duration_minutes: parsed.data.maxDurationMinutes,
        organization_id: user.organizationId,
        status: "scheduled",
        invitation_token: token,
        invitation_expires_at: expiresAt,
      })
      .select("*, candidates(name, email), jobs(title)")
      .single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });
}
