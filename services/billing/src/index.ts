import { prisma } from "@vyntro/db";
import { getStripeClient } from "./client";

const PRICE_BY_PLAN: Record<"premium_monthly" | "premium_yearly", string | undefined> = {
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
};

const PLAN_BY_PRICE: Record<string, "premium_monthly" | "premium_yearly"> = Object.fromEntries(
  Object.entries(PRICE_BY_PLAN)
    .filter(([, priceId]) => Boolean(priceId))
    .map(([plan, priceId]) => [priceId as string, plan as "premium_monthly" | "premium_yearly"]),
);

interface SubscriptionRow {
  id: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

async function getOrCreateCustomerId(userId: string, email: string): Promise<string> {
  const existing: SubscriptionRow | null = await prisma.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({ email, metadata: { userId } });

  await prisma.subscription.create({
    data: { userId, stripeCustomerId: customer.id, plan: "free", status: "active" },
  });

  return customer.id;
}

/** Creates a Stripe Checkout session for a paid plan and returns the redirect URL. */
export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: "premium_monthly" | "premium_yearly",
): Promise<string> {
  const priceId = PRICE_BY_PLAN[plan];
  if (!priceId) throw new Error(`No Stripe price configured for plan "${plan}"`);

  const customerId = await getOrCreateCustomerId(userId, email);
  const webAppUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${webAppUrl}/account/billing?checkout=success`,
    cancel_url: `${webAppUrl}/account/billing?checkout=cancelled`,
    metadata: { userId, plan },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

/** Creates a Stripe Billing Portal session so the user can manage/cancel their subscription. */
export async function createPortalSession(userId: string): Promise<string> {
  const subscription: SubscriptionRow | null = await prisma.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (!subscription?.stripeCustomerId) throw new Error("No Stripe customer found for this user");

  const webAppUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${webAppUrl}/account/billing`,
  });

  return session.url;
}

async function upsertSubscriptionFromStripe(stripeSubscription: {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: { data: Array<{ price: { id: string } | null }> };
}): Promise<void> {
  const priceId = stripeSubscription.items.data[0]?.price?.id;
  const plan = priceId ? PLAN_BY_PRICE[priceId] ?? "free" : "free";
  const status = STATUS_MAP[stripeSubscription.status] ?? "active";

  const existing: SubscriptionRow | null = await prisma.subscription.findFirst({
    where: { stripeCustomerId: stripeSubscription.customer },
    orderBy: { createdAt: "desc" },
  });
  if (!existing) return;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      stripeSubscriptionId: stripeSubscription.id,
      plan,
      status,
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });
}

const STATUS_MAP: Record<string, "active" | "past_due" | "canceled" | "trialing"> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  unpaid: "past_due",
  incomplete: "past_due",
  incomplete_expired: "canceled",
};

/**
 * Verifies and processes a Stripe webhook event. Subscription state is only
 * ever updated from these verified events, never from client-supplied data.
 */
export async function handleSubscriptionWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured");

  const stripe = getStripeClient();
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as { subscription?: string | null; customer?: string | null };
      if (session.subscription && session.customer) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await upsertSubscriptionFromStripe(subscription as never);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await upsertSubscriptionFromStripe(event.data.object as never);
      break;
    }
    case "customer.subscription.deleted": {
      const stripeSubscription = event.data.object as { id: string; customer: string };
      const existing: SubscriptionRow | null = await prisma.subscription.findFirst({
        where: { stripeCustomerId: stripeSubscription.customer },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: { plan: "free", status: "canceled", cancelAtPeriodEnd: false },
        });
      }
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as {
        customer: string;
        id: string;
        amount_paid: number;
        currency: string;
        created: number;
      };
      const existing: SubscriptionRow | null = await prisma.subscription.findFirst({
        where: { stripeCustomerId: invoice.customer },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        await prisma.invoice.create({
          data: {
            subscriptionId: existing.id,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: event.type === "invoice.paid" ? "paid" : "payment_failed",
            issuedAt: new Date(invoice.created * 1000),
          },
        });
      }
      break;
    }
    default:
      break;
  }
}

export async function getCurrentSubscription(userId: string) {
  return prisma.subscription.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
}
