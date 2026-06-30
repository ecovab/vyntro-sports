import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
import * as bcrypt from "bcryptjs";
import { prisma, type User } from "@vyntro/db";
import { generateOpaqueToken, hashOpaqueToken } from "./token.util";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(private readonly jwtService: JwtService) {}

  async signup(email: string, password: string, displayName?: string): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    await this.createEmailVerificationToken(user.id);
    const tokens = await this.issueTokenPair(user);
    return { user: toPublicUser(user), tokens };
  }

  async login(email: string, password: string, context?: { userAgent?: string; ip?: string }): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.status !== "active") {
      throw new UnauthorizedException("This account is not active");
    }

    const tokens = await this.issueTokenPair(user, context);
    return { user: toPublicUser(user), tokens };
  }

  /** Rotates the refresh token on every use so a stolen token has a single-use window. */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = hashOpaqueToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: { refreshTokenHash: tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!session) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    await prisma.session.delete({ where: { id: session.id } });
    return this.issueTokenPair(user, { userAgent: session.userAgent ?? undefined, ip: session.ip ?? undefined });
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashOpaqueToken(refreshToken);
    await prisma.session.deleteMany({ where: { refreshTokenHash: tokenHash } });
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const record = await prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) {
      throw new UnauthorizedException("Invalid or expired verification token");
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
      prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) {
      return; // do not leak account existence/verification state
    }
    await this.createEmailVerificationToken(user.id);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return; // generic response regardless of whether the account exists
    }

    const token = generateOpaqueToken();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });
    // TODO(Phase 7-adjacent): send via transactional email provider (e.g. Resend/SES)
    // instead of console output once that integration exists.
    console.log(`[auth] password reset token for ${email}: ${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const record = await prisma.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Invalidate existing sessions so a leaked password can't be combined with a live session.
      prisma.session.deleteMany({ where: { userId: record.userId } }),
    ]);
  }

  async loginWithGoogle(idToken: string): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException("Invalid Google token");
    }

    const user = await this.findOrCreateOAuthUser("google", payload.sub, payload.email, payload.name);
    const tokens = await this.issueTokenPair(user);
    return { user: toPublicUser(user), tokens };
  }

  async loginWithApple(idToken: string, displayName?: string): Promise<{ user: PublicUser; tokens: TokenPair }> {
    // TODO(Phase 3 follow-up): verify the JWT signature against Apple's published
    // JWKS (https://appleid.apple.com/auth/keys) before trusting the payload.
    // Decoding without signature verification is a placeholder, not production-safe.
    const payload = decodeJwtPayloadUnsafe(idToken);
    if (!payload?.email || !payload.sub) {
      throw new UnauthorizedException("Invalid Apple token");
    }

    const user = await this.findOrCreateOAuthUser("apple", payload.sub, payload.email, displayName);
    const tokens = await this.issueTokenPair(user);
    return { user: toPublicUser(user), tokens };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toPublicUser(user);
  }

  private async findOrCreateOAuthUser(provider: string, providerAccountId: string, email: string, displayName?: string): Promise<User> {
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });
    if (existingOAuth) {
      return existingOAuth.user;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await prisma.oAuthAccount.create({
        data: { userId: existingUser.id, provider, providerAccountId },
      });
      return existingUser;
    }

    return prisma.user.create({
      data: {
        email,
        displayName,
        emailVerifiedAt: new Date(), // OAuth providers have already verified the email
        oauthAccounts: { create: { provider, providerAccountId } },
      },
    });
  }

  private async createEmailVerificationToken(userId: string): Promise<string> {
    const token = generateOpaqueToken();
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });
    // TODO(Phase 7-adjacent): send via transactional email provider instead of logging.
    console.log(`[auth] email verification token for user ${userId}: ${token}`);
    return token;
  }

  private async issueTokenPair(user: User, context?: { userAgent?: string; ip?: string }): Promise<TokenPair> {
    const accessToken = this.jwtService.sign(
      { id: user.id, role: user.role, type: "access" },
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );

    const refreshToken = generateOpaqueToken();
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashOpaqueToken(refreshToken),
        userAgent: context?.userAgent,
        ip: context?.ip,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
  }
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: User["role"];
  emailVerified: boolean;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerifiedAt !== null,
  };
}

function decodeJwtPayloadUnsafe(token: string): { email?: string; sub?: string } | null {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
