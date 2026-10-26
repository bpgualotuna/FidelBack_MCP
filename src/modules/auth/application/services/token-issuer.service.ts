import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../../context/database/prisma.service';
import { EnvironmentVariables } from '../../../../context/config/app.config';
import { durationToMs } from '../../../../common/utils/duration.util';
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
  };
}

interface StoredRefreshSession {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  tokenHash: string;
  isRevoked: boolean;
  expiresAt: number;
}

@Injectable()
export class TokenIssuerService {
  // Store refresh token hashes in memory for fast rotation & reuse detection
  private readonly refreshStore = new Map<string, StoredRefreshSession>();

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
    _meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokenResult> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas o usuario inactivo.');
    }

    const isPasswordValid = await this.hasher.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    return this.issueTokensForUser(user);
  }

  async issueTokensForUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  }): Promise<AuthTokenResult> {
    const jwtSecret = this.configService.get('JWT_SECRET', { infer: true });
    const accessExpiration = this.configService.get('JWT_EXPIRES_IN', { infer: true });
    const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
    const refreshMaxAgeMs = durationToMs(refreshExpiration);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        typ: 'access',
      },
      {
        secret: jwtSecret,
        expiresIn: Math.floor(durationToMs(accessExpiration) / 1000),
      },
    );

    const rawRefreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashTokenSha256(rawRefreshToken);

    this.refreshStore.set(tokenHash, {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tokenHash,
      isRevoked: false,
      expiresAt: Date.now() + refreshMaxAgeMs,
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
      },
    };
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    _meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokenResult> {
    const tokenHash = this.hashTokenSha256(rawRefreshToken);
    const existing = this.refreshStore.get(tokenHash);

    if (!existing) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    if (existing.isRevoked) {
      for (const session of this.refreshStore.values()) {
        if (session.userId === existing.userId) {
          session.isRevoked = true;
        }
      }
      throw new UnauthorizedException('Reutilización de token detectada. Sesiones revocadas.');
    }

    if (existing.expiresAt < Date.now()) {
      throw new UnauthorizedException('Refresh token expirado.');
    }

    existing.isRevoked = true;

    return this.issueTokensForUser({
      id: existing.userId,
      email: existing.email,
      fullName: existing.fullName,
      role: existing.role,
    });
  }

  async revokeRefreshToken(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashTokenSha256(rawRefreshToken);
    const existing = this.refreshStore.get(tokenHash);
    if (existing) {
      existing.isRevoked = true;
    }
  }
}
