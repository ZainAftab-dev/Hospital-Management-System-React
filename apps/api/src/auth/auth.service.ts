import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

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
}
