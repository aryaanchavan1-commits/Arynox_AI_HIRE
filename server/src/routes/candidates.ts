import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../database/client.js";

const candidateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  title: z.string().optional(),
  skills: z.array(z.string()).default([]),
  experience: z.string().optional(),
  education: z.string().optional(),
  cvText: z.string().optional(),
  githubUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
});

export async function candidatesRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const user = (request as any).user;
    const orgId = user.organizationId;
    const { data, error } = await supabaseAdmin.from("candidates").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
    if (error) return reply.status(500).send({ error: error.message });
    return { candidates: data };
  });

  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await supabaseAdmin.from("candidates").select("*").eq("id", id).single();
    if (error) return reply.status(404).send({ error: "Candidate not found" });
    return data;
  });

  app.post("/", async (request, reply) => {
    const user = (request as any).user;
    const parsed = candidateSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin.from("candidates").insert({
      ...parsed.data,
      organization_id: user.organizationId,
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });
}
