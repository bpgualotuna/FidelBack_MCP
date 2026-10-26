import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../../../context/database/prisma.service';
import { EnvironmentVariables } from '../../../../context/config/app.config';
import { parseDurationToMs } from '../../../../common/utils/duration.util';
import { HASHER_PORT, HasherPort } from '../../domain/interfaces/hasher.port';

export interface AuthTokenResult {
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeMs: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId?: string | null;
  };
}

@Injectable()
export class TokenIssuerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    @Inject(HASHER_PORT) private readonly hasher: HasherPort,
  ) {}

  private hashTokenSha256(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async login(
    email: string,
    password: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokenResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas o usuario inactivo.');
    }

    const isPasswordValid = await this.hasher.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.issueTokensForUser(user, meta);
  }

  async issueTokensForUser(
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      tenantId?: string | null;
    },
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokenResult> {
    const accessSecret = this.configService.get('JWT_ACCESS_SECRET', { infer: true });
    const accessExpiration = this.configService.get('JWT_ACCESS_EXPIRATION', { infer: true });
    const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION', { infer: true });
    const refreshMaxAgeMs = parseDurationToMs(refreshExpiration);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId ?? undefined,
      },
      {
        secret: accessSecret,
        expiresIn: Math.floor(parseDurationToMs(accessExpiration) / 1000),
      },
    );

    const rawRefreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashTokenSha256(rawRefreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        expiresAt: new Date(Date.now() + refreshMaxAgeMs),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      refreshMaxAgeMs,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokenResult> {
    const tokenHash = this.hashTokenSha256(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    if (existing.isRevoked) {
      // Reuse detection: revoke all active tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId: existing.userId, isRevoked: false },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Reutilización de token detectada. Sesiones revocadas.');
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado.');
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { isRevoked: true },
    });

    return this.issueTokensForUser(existing.user, meta);
  }

  async revokeRefreshToken(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashTokenSha256(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, isRevoked: false },
      data: { isRevoked: true },
    });
  }
}
