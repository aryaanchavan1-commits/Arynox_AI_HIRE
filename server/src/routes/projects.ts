import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabaseAdmin } from "../database/client.js";

const projectSchema = z.object({
  candidateId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  techStack: z.array(z.string()).default([]),
});

export async function projectsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const user = (request as any).user;
    const { data, error } = await supabaseAdmin.from("projects").select("*").eq("organization_id", user.organizationId);
    if (error) return reply.status(500).send({ error: error.message });
    return { projects: data };
  });

  app.post("/", async (request, reply) => {
    const user = (request as any).user;
    const parsed = projectSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: "Validation failed", details: parsed.error.flatten() });

    const { data, error } = await supabaseAdmin.from("projects").insert({
      ...parsed.data,
      organization_id: user.organizationId,
      verified: false,
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });

  app.post("/:id/verify", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { verificationData } = request.body as { verificationData: any };
    const { data, error } = await supabaseAdmin.from("projects").update({ verified: true, verification_data: verificationData }).eq("id", id).select().single();
    if (error) return reply.status(500).send({ error: error.message });
    return data;
  });
}
