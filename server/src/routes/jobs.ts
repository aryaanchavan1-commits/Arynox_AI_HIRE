import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../database/client.js";

const jobSchema = z.object({
  title: z.string().min(1),
  department: z.string().optional(),
  location: z.string().optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional(),
  experience: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().min(1),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  interviewLanguage: z.enum(["en", "hi", "mr"]).default("en"),
  difficulty: z.number().min(1).max(5).default(3),
  duration: z.number().default(30),
  interviewRounds: z.number().default(1),
  evaluationCriteria: z.string().optional(),
  companyKnowledge: z.string().optional(),
});

export async function jobsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const user = (request as any).user;
    const orgId = user.organizationId;
    const { data, error } = await supabaseAdmin.from("jobs").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
    if (error) return reply.status(500).send({ error: error.message });
    return { jobs: data };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await supabaseAdmin.from("jobs").select("*").eq("id", id).single();
    if (error) return reply.status(404).send({ error: "Job not found" });
    return data;
  });

  app.post("/", async (request, reply) => {
    const user = (request as any).user;
    const parsed = jobSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin.from("jobs").insert({
      ...parsed.data,
      organization_id: user.organizationId,
      created_by: user.id,
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  app.patch("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = jobSchema.partial().safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin.from("jobs").update(parsed.data).eq("id", id).select().single();
    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { error } = await supabaseAdmin.from("jobs").delete().eq("id", id);
    if (error) return reply.status(500).send({ error: error.message });
    return { deleted: true };
  });
}
