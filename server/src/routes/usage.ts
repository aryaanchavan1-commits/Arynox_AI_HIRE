import { FastifyInstance } from "fastify";
import { supabaseAdmin } from "../database/client.js";

export async function usageRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const user = (request as any).user;
    const { data, error } = await supabaseAdmin.from("usage_records").select("*").eq("organization_id", user.organizationId);
    if (error) return reply.status(500).send({ error: error.message });

    const usage = {
      interviews: data?.filter((r: any) => r.type === "interview").length || 0,
      candidates: data?.filter((r: any) => r.type === "candidate").length || 0,
      tokens: data?.reduce((sum: number, r: any) => sum + (r.tokens || 0), 0) || 0,
      minutes: data?.reduce((sum: number, r: any) => sum + (r.minutes || 0), 0) || 0,
    };
    return { usage };
  });
}
