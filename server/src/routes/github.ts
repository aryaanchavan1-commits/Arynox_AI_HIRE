import { FastifyInstance } from "fastify";
import { config } from "../config/index.js";
import { supabaseAdmin } from "../database/client.js";

export async function githubRoutes(app: FastifyInstance) {
  app.post("/connect", async (request, reply) => {
    if (config.APP_MODE === "local" && !config.GITHUB_CLIENT_ID) {
      return reply.status(200).send({
        mockMode: true,
        message: "GitHub mock mode - simulated connection",
        account: { login: "mock-user", avatar_url: "", public_repos: 5 },
      });
    }
    return reply.status(200).send({ redirectUrl: `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&scope=repo,user` });
  });

  app.get("/repositories", async (request, reply) => {
    if (config.APP_MODE === "local" && !config.GITHUB_CLIENT_ID) {
      return { repositories: [
        { id: 1, name: "mock-project-1", description: "A sample ML project", language: "Python", stargazers_count: 12, forks_count: 3, updated_at: "2026-01-15T00:00:00Z" },
        { id: 2, name: "mock-project-2", description: "React web application", language: "TypeScript", stargazers_count: 8, forks_count: 2, updated_at: "2026-02-20T00:00:00Z" },
      ]};
    }
    return { repositories: [] };
  });
}
