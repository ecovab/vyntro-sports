import { Injectable } from "@nestjs/common";

@Injectable()
export class BillingService {
  // Implemented in Phase 8: Stripe checkout/portal/webhook handling
  async getPlans() {
    return [
      { id: "free", name: "Free" },
      { id: "premium_monthly", name: "Premium Monthly" },
      { id: "premium_yearly", name: "Premium Yearly" },
    ];
  }

  async createCheckoutSession(_userId: string, _plan: string) {
    throw new Error("Not implemented");
  }

  async createPortalSession(_userId: string) {
    throw new Error("Not implemented");
  }

  async handleStripeWebhook(_rawBody: Buffer, _signature: string) {
    throw new Error("Not implemented");
  }

  async getCurrentSubscription(_userId: string) {
    return null;
  }
}
