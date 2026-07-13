import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

type AttemptBucket = {
  count: number;
  firstAttemptAt: number;
};

@Injectable()
export class AuthService {
  private readonly loginAttempts = new Map<string, AttemptBucket>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {
    // Evict expired rate-limit buckets every 5 minutes to prevent memory growth
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.loginAttempts.entries()) {
        if (now - bucket.firstAttemptAt > LOGIN_WINDOW_MS) {
          this.loginAttempts.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    interval.unref();
  }

  async login(email: string, password: string, ip = 'unknown') {
    const normalizedEmail = email.trim().toLowerCase();
    const attemptKey = `${normalizedEmail}:${ip}`;
    this.assertLoginAllowed(attemptKey);

    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || user.status !== 'Active' || !(await compare(password, user.passwordHash))) {
      this.recordFailedAttempt(attemptKey);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginAttempts.delete(attemptKey);

    const token = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      {
        secret: this.config.get<string>('JWT_SECRET') ?? 'development-secret',
        expiresIn: '8h'
      }
    );

    return {
      accessToken: token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    };
  }

  private assertLoginAllowed(key: string) {
    const bucket = this.loginAttempts.get(key);
    if (!bucket) return;

    if (Date.now() - bucket.firstAttemptAt > LOGIN_WINDOW_MS) {
      this.loginAttempts.delete(key);
      return;
    }

    if (bucket.count >= MAX_LOGIN_ATTEMPTS) {
      throw new HttpException('Too many failed login attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private recordFailedAttempt(key: string) {
    const now = Date.now();
    const bucket = this.loginAttempts.get(key);
    if (!bucket || now - bucket.firstAttemptAt > LOGIN_WINDOW_MS) {
      this.loginAttempts.set(key, { count: 1, firstAttemptAt: now });
      return;
    }
    bucket.count += 1;
  }
}