import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Response } from 'express';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

type LoginRequest = {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
};

const COOKIE_NAME = 'hms_token';
const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const CROSS_SITE = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: CROSS_SITE ? ('none' as const) : ('lax' as const),
  secure: CROSS_SITE,
  path: '/'
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() request: LoginRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor ?? request.ip ?? 'unknown';
    const result = await this.auth.login(body.email, body.password, ip);
    res.cookie(COOKIE_NAME, result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: COOKIE_MAX_AGE_MS
    });
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    return { success: true };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: { user: { id: string; name: string; role: string; email: string } }) {
    return req.user;
  }
}
