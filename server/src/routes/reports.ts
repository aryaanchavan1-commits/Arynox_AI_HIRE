import { FastifyInstance } from "fastify";
import { supabaseAdmin } from "../database/client.js";

export async function reportsRoutes(app: FastifyInstance) {
  app.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await supabaseAdmin.from("interview_reports").select("*").eq("id", id).single();
    if (error) return reply.status(404).send({ error: "Report not found" });
    return data;
  });
}
