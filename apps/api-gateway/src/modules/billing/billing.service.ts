import { Injectable } from "@nestjs/common";
import {
  createCheckoutSession,
  createPortalSession,
  getCurrentSubscription,
  handleSubscriptionWebhookEvent,
} from "@vyntro/svc-billing";
import { prisma } from "@vyntro/db";

@Injectable()
export class BillingService {
  async getPlans() {
    return [
      { id: "free", name: "Free" },
      { id: "premium_monthly", name: "Premium Monthly" },
      { id: "premium_yearly", name: "Premium Yearly" },
    ];
  }

  async createCheckoutSession(userId: string, plan: "premium_monthly" | "premium_yearly") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) throw new Error("User not found");
    const url = await createCheckoutSession(userId, user.email, plan);
    return { url };
  }

  async createPortalSession(userId: string) {
    const url = await createPortalSession(userId);
    return { url };
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    await handleSubscriptionWebhookEvent(rawBody, signature);
    return { received: true };
  }

  async getCurrentSubscription(userId: string) {
    return getCurrentSubscription(userId);
  }
}
