import { Body, Controller, Get, Headers, Post, Req } from "@nestjs/common";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("plans")
  plans() {
    return this.billingService.getPlans();
  }

  @Get("subscription")
  subscription() {
    // TODO: derive userId from auth guard once implemented
    return this.billingService.getCurrentSubscription("TODO");
  }

  @Post("checkout-session")
  checkout(@Body() body: { plan: string }) {
    return this.billingService.createCheckoutSession("TODO", body.plan);
  }

  @Post("portal-session")
  portal() {
    return this.billingService.createPortalSession("TODO");
  }

  @Post("webhooks/stripe")
  webhook(@Req() req: { rawBody: Buffer }, @Headers("stripe-signature") signature: string) {
    return this.billingService.handleStripeWebhook(req.rawBody, signature);
  }
}
