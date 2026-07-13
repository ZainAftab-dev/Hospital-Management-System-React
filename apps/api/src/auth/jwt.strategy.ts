import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    super({
      // Accept token from httpOnly cookie first, fall back to Bearer header
      jwtFromRequest: (req: any) => {
        const cookieToken = req?.cookies?.hms_token;
        if (cookieToken) return cookieToken;
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'development-secret'
    });
  }

  async validate(payload: { sub: string; email: string; role: string; name: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'Active') {
      throw new UnauthorizedException('Account is inactive or not found');
    }
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }
}
