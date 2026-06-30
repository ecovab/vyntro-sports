import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!client) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not configured");
    client = new Stripe(apiKey, { apiVersion: "2024-06-20" });
  }
  return client;
}
