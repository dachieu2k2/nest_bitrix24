import { Module } from '@nestjs/common';
import { AuthBitrixService } from './auth.service';

@Module({
  providers: [AuthBitrixService],
  exports: [AuthBitrixService],
})
export class AuthBitrixModule {}
