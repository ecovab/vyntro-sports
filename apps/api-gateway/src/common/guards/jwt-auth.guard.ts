import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { UserRole } from "@vyntro/db";

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

/**
 * Global guard: every route requires a valid access token unless marked
 * @Public(). Attaches the decoded user (id, role) to req.user for
 * @CurrentUser() and RolesGuard to consume.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    try {
      const payload = this.jwtService.verify<AuthenticatedUser & { type: string }>(token);
      if (payload.type !== "access") {
        throw new UnauthorizedException("Invalid token type");
      }
      request.user = { id: payload.id, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }

  private extractToken(request: { headers: Record<string, string | undefined> }): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return undefined;
    }
    return header.slice("Bearer ".length);
  }
}
