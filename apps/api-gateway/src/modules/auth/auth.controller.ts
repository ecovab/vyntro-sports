import { Body, Controller, Get, HttpCode, Ip, Post, Headers } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import {
  AppleAuthDto,
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  RefreshDto,
  ResendVerificationDto,
  ResetPasswordDto,
  SignupDto,
  VerifyEmailDto,
} from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  signup(@Body() body: SignupDto) {
    return this.authService.signup(body.email, body.password, body.displayName);
  }

  @Public()
  @Post("login")
  login(@Body() body: LoginDto, @Headers("user-agent") userAgent: string, @Ip() ip: string) {
    return this.authService.login(body.email, body.password, { userAgent, ip });
  }

  @Public()
  @Post("refresh")
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Public()
  @Post("logout")
  @HttpCode(204)
  logout(@Body() body: RefreshDto) {
    return this.authService.logout(body.refreshToken);
  }

  @Public()
  @Post("oauth/google")
  oauthGoogle(@Body() body: GoogleAuthDto) {
    return this.authService.loginWithGoogle(body.idToken);
  }

  @Public()
  @Post("oauth/apple")
  oauthApple(@Body() body: AppleAuthDto) {
    return this.authService.loginWithApple(body.idToken, body.displayName);
  }

  @Public()
  @Post("verify-email")
  @HttpCode(204)
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Public()
  @Post("resend-verification")
  @HttpCode(204)
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @Public()
  @Post("password/forgot")
  @HttpCode(204)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post("password/reset")
  @HttpCode(204)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
