import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../database/client.js";

const assessmentSchema = z.object({
  title: z.string().min(1),
  jobId: z.string().uuid().optional(),
  skills: z.array(z.string()).default([]),
  questions: z.array(z.object({
    type: z.enum(["mcq", "short_answer", "coding"]),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().optional(),
    skill: z.string().optional(),
    difficulty: z.number().min(1).max(5).default(3),
  })).default([]),
  duration: z.number().default(60),
});

export async function assessmentsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const user = (request as any).user;
    const { data, error } = await supabaseAdmin.from("assessments").select("*").eq("organization_id", user.organizationId);
    if (error) return reply.status(500).send({ error: error.message });
    return { assessments: data };
  });

  app.post("/", async (request, reply) => {
    const user = (request as any).user;
    const parsed = assessmentSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin.from("assessments").insert({
      ...parsed.data,
      organization_id: user.organizationId,
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });
}
