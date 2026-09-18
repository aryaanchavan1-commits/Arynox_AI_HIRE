import { FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config/index.js";
import { supabaseAdmin } from "../database/client.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "candidate" | "recruiter" | "organization_admin" | "platform_admin";
  organizationId?: string;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);

  // In local mock mode, accept any token and resolve to the demo user
  if (config.APP_MODE === "local") {
    const { data: profile } = await supabaseAdmin.from("profiles").select("*").limit(1);
    if (profile && profile.length > 0) {
      const { data: memberships } = await supabaseAdmin
        .from("organization_members")
        .select("*")
        .eq("user_id", profile[0].id);

      (request as any).user = {
        id: profile[0].id,
        email: profile[0].email,
        role: profile[0].role || "recruiter",
        organizationId: memberships?.[0]?.organization_id,
      } as AuthUser;
      return;
    }
  }

  try {
    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.verify(token, config.JWT_SECRET) as AuthUser;
    (request as any).user = decoded;
  } catch {
    return reply.status(401).send({ error: "Invalid or expired token" });
  }
}

export async function roleGuard(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user as AuthUser;
    if (!user || !roles.includes(user.role)) {
      return reply.status(403).send({ error: "Insufficient permissions" });
    }
  };
}
