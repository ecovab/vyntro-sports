/**
 * Stripe integration: checkout sessions, customer portal, and webhook
 * handlers for subscription lifecycle events. Implemented in Phase 8.
 */
export async function createCheckoutSession(_userId: string, _priceId: string): Promise<string> {
  throw new Error("Not implemented");
}

export async function handleSubscriptionWebhookEvent(_event: unknown): Promise<void> {
  throw new Error("Not implemented");
}
