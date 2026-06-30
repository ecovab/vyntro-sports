import { Body, Controller, Post, Get } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body() body: { email: string; password: string }) {
    return this.authService.signup(body.email, body.password);
  }

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get("me")
  me() {
    // Implemented once JWT guard is wired in Phase 3
    return { todo: "return authenticated user profile" };
  }
}
