import { FastifyInstance } from "fastify";
import { supabaseAdmin } from "../database/client.js";

export async function documentsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const user = (request as any).user;
    const { data, error } = await supabaseAdmin.from("documents").select("*").eq("organization_id", user.organizationId);
    if (error) return reply.status(500).send({ error: error.message });
    return { documents: data };
  });

  app.post("/", async (request, reply) => {
    const user = (request as any).user;
    const parts = await request.file();
    if (!parts) return reply.status(400).send({ error: "No file uploaded" });

    const chunks: Buffer[] = [];
    for await (const chunk of parts.file) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const filename = parts.filename;

    const { data, error } = await supabaseAdmin.from("documents").insert({
      name: filename,
      type: parts.mimetype,
      size: buffer.length,
      organization_id: user.organizationId,
      uploaded_by: user.id,
      status: "uploaded",
    }).select().single();

    if (error) return reply.status(500).send({ error: error.message });
    return reply.status(201).send(data);
  });
}
