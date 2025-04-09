import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Bitrix24Module } from './bitrix24/bitrix24.module';
import { ConfigModule } from '@nestjs/config';
import { AxiosApiService } from './common/api.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AxiosApiBitrixService } from './common/api-bitrix.service ';

@Module({
  imports: [
    Bitrix24Module,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(`mongodb://localhost:27017/?directConnection=true`, {
      dbName: 'bitrix_messages',
    }),

    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule.forRoot()],
    //   useFactory: () => ({
    //     uri: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.epq0h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,

    //   }),
    // }),
  ],
  controllers: [AppController],
  providers: [AppService, AxiosApiService, AxiosApiBitrixService],
})
export class AppModule {}
