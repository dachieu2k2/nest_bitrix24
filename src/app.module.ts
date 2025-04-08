import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MessagesModule } from './messages/messages.module';
import { Bitrix24Module } from './bitrix24/bitrix24.module';
import { ConfigModule } from '@nestjs/config';
import { AuthBitrixModule } from './auth_bitrix/auth.module';
import { AxiosApiService } from './common/api.service';

@Module({
  imports: [
    MessagesModule,
    Bitrix24Module,
    ConfigModule.forRoot(),
    AuthBitrixModule,
  ],
  controllers: [AppController],
  providers: [AppService, AxiosApiService],
})
export class AppModule {}
