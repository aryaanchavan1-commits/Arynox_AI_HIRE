import { FastifyRequest, FastifyReply } from "fastify";
import { AuthUser } from "./auth.js";

export async function tenantIsolation(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user as AuthUser;
  if (!user?.organizationId && user?.role !== "platform_admin") {
    return reply.status(403).send({ error: "No organization context" });
  }
  (request as any).organizationId = user.organizationId;
}
