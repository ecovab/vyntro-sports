import { BadRequestException, Body, Controller, Get, Headers, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
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
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() body: { plan: "premium_monthly" | "premium_yearly" }) {
    if (body.plan !== "premium_monthly" && body.plan !== "premium_yearly") {
      throw new BadRequestException("plan must be premium_monthly or premium_yearly");
    }
    return this.billingService.createCheckoutSession(user.id, body.plan);
  }

  @Post("portal-session")
  portal(@CurrentUser() user: AuthenticatedUser) {
    return this.billingService.createPortalSession(user.id);
  }

  @Public()
  @Post("webhooks/stripe")
  webhook(@Req() req: RawBodyRequest<Request>, @Headers("stripe-signature") signature: string) {
    if (!req.rawBody) throw new BadRequestException("Missing raw request body");
    return this.billingService.handleStripeWebhook(req.rawBody, signature);
  }
}
