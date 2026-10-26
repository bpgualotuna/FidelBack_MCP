import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { HasherPort } from '../../domain/interfaces/hasher.port';

@Injectable()
export class BcryptAdapter implements HasherPort {
  private readonly SALT_ROUNDS = 10;

  async hash(plain: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcrypt');
      return await bcrypt.hash(plain, this.SALT_ROUNDS);
    } catch {
      const salt = crypto.randomBytes(16).toString('hex');
      const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
      return `scrypt:${salt}:${derived}`;
    }
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    if (hash.startsWith('scrypt:') || hash.startsWith('scrypt$')) {
      const sep = hash.startsWith('scrypt:') ? ':' : '$';
      const [, salt, storedKey] = hash.split(sep);
      const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(storedKey, 'hex'), Buffer.from(derived, 'hex'));
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const bcrypt = require('bcrypt');
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }
}
