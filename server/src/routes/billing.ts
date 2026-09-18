import { FastifyInstance } from "fastify";
import { config } from "../config/index.js";
import { supabaseAdmin } from "../database/client.js";

export async function billingRoutes(app: FastifyInstance) {
  app.post("/checkout", async (request, reply) => {
    const { planId } = request.body as { planId: string };
    if (config.APP_MODE === "local" && !config.RAZORPAY_KEY_ID) {
      return reply.status(200).send({ mockMode: true, message: "Razorpay mock mode", subscription: { planId, status: "active" } });
    }
    return reply.status(200).send({ checkoutUrl: "#" });
  });

  app.get("/plans", async () => ({
    plans: [
      { id: "free", name: "Free", price: 0, currency: "INR", interval: "month", features: ["5 Interviews", "10 Candidates", "3 Jobs"] },
      { id: "starter", name: "Starter", price: 499900, currency: "INR", interval: "month", features: ["50 Interviews", "100 Candidates", "10 Jobs"] },
      { id: "growth", name: "Growth", price: 1499900, currency: "INR", interval: "month", features: ["200 Interviews", "500 Candidates", "50 Jobs"] },
      { id: "business", name: "Business", price: 3999900, currency: "INR", interval: "month", features: ["Unlimited Interviews", "Unlimited Candidates", "Unlimited Jobs"] },
    ],
  }));
}
