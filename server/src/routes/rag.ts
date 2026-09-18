import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function ragRoutes(app: FastifyInstance) {
  app.post("/search", async (request, reply) => {
    const { query, documentIds } = request.body as { query: string; documentIds?: string[] };
    if (!query) return reply.status(400).send({ error: "Query is required" });

    return { results: [
      { content: "Mock RAG result: This is a simulated document chunk for local mode.", documentId: "mock-doc", score: 0.85 },
    ], mockMode: true };
  });
}
