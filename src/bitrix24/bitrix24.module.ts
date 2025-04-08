import { Module } from '@nestjs/common';
import { Bitrix24Service } from './bitrix24.service';
import { AuthBitrixService } from 'src/auth_bitrix/auth.service';
import { AxiosApiService } from 'src/common/api.service';
import { Bitrix24Controller } from './bitrix24.controller';

@Module({
  providers: [Bitrix24Service, AuthBitrixService, AxiosApiService],
  controllers: [Bitrix24Controller],
})
export class Bitrix24Module {}
