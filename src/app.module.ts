import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Bitrix24Module } from './bitrix24/bitrix24.module';
import { ConfigModule } from '@nestjs/config';
import { AxiosApiService } from './common/api.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AxiosApiBitrixService } from './common/api-bitrix.service ';
import { CacheModule } from '@nestjs/cache-manager';
import configuration from './config/configuration';
import { HttpModule } from '@nestjs/axios';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { QueueModule } from './queues/queue.module';

@Module({
  imports: [
    Bitrix24Module,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        baseURL: process.env.BITRIX_API_URL,
        timeout: 5000,
        timeoutErrorMessage: '🚧🚧🚧 Server connection time out !',
      }),
      global: true,
    }),
    MongooseModule.forRoot(`mongodb://localhost:27017/?directConnection=true`, {
      dbName: 'bitrix_messages',
    }),
    // CacheModule.register({
    //   store: redisStore,
    //   host: '172.0.0.1',
    //   port: 6379,
    //   auth_pass: 1111,
    //   isGlobal: true,
    // }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redis = new KeyvRedis({
          url: 'redis://default:1111@localhost:6379',
        });

        const store = new Keyv({ store: redis });

        return {
          store: {
            ...store,
            get: (key) => store.get(key),
            set: (key, value, ttl) => store.set(key, value, ttl),
            del: (key) => store.delete(key),
          },
        };

        // return {
        //   stores: [
        //     new Keyv({
        //       store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
        //     }),
        //     createKeyv('redis://localhost:6379'),
        //   ],
        // };
      },
    }),
    QueueModule,

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
