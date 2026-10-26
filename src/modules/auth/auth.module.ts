import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './api/controllers/auth.controller';
import { TokenIssuerService } from './application/services/token-issuer.service';
import { HASHER_PORT } from './domain/interfaces/hasher.port';
import { BcryptAdapter } from './infrastructure/adapters/bcrypt.adapter';
import { JwtStrategy } from './infrastructure/adapters/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    TokenIssuerService,
    JwtStrategy,
    {
      provide: HASHER_PORT,
      useClass: BcryptAdapter,
    },
  ],
  exports: [TokenIssuerService, HASHER_PORT],
})
export class AuthModule {}
