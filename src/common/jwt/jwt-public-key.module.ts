import { Global, Module } from '@nestjs/common';
import { JwtPublicKeyService } from './jwt-public-key.service.js';

@Global()
@Module({
  providers: [JwtPublicKeyService],
  exports: [JwtPublicKeyService],
})
export class JwtPublicKeyModule {}
