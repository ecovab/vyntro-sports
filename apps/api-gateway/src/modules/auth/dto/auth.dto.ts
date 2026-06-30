import { IsEmail, IsString, MinLength } from "class-validator";

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  displayName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class GoogleAuthDto {
  @IsString()
  idToken!: string;
}

export class AppleAuthDto {
  @IsString()
  idToken!: string;

  @IsString()
  displayName?: string;
}
