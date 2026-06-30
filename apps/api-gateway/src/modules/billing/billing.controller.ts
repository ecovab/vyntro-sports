import { Body, Controller, Get, Headers, Post, Req } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Get("plans")
  plans() {
    return this.billingService.getPlans();
  }

  @Get("subscription")
  subscription(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.getCurrentSubscription(user.id);
  }

  @Post("checkout-session")
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() body: { plan: string }) {
    return this.billingService.createCheckoutSession(user.id, body.plan);
  }

  @Post("portal-session")
  portal(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.createPortalSession(user.id);
  }

  @Public()
  @Post("webhooks/stripe")
  webhook(@Req() req: { rawBody: Buffer }, @Headers("stripe-signature") signature: string) {
    return this.billingService.handleStripeWebhook(req.rawBody, signature);
  }
}
