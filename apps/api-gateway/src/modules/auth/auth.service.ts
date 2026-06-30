import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {
  // Implemented in Phase 3: signup/login/oauth/email-verification/password-reset
  async signup(_email: string, _password: string) {
    throw new Error("Not implemented");
  }

  async login(_email: string, _password: string) {
    throw new Error("Not implemented");
  }
}
