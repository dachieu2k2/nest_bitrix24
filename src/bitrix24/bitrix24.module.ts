import { Module } from '@nestjs/common';
import { Bitrix24Service } from './bitrix24.service';
import { AuthBitrixService } from 'src/bitrix24/auth_bitrix/auth.service';
import { AxiosApiService } from 'src/common/api.service';
import { Bitrix24Controller } from './bitrix24.controller';
import { AuthBitrixModule } from './auth_bitrix/auth.module';
import { MessagesModule } from './messages/messages.module';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [AuthBitrixModule, MessagesModule, TerminusModule],
  providers: [Bitrix24Service, AuthBitrixService, AxiosApiService],
  controllers: [Bitrix24Controller],
  exports: [AuthBitrixModule, MessagesModule, Bitrix24Service],
})
export class Bitrix24Module {}
