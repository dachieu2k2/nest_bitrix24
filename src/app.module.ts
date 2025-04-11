import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Bitrix24Module } from './bitrix24/bitrix24.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
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
    MongooseModule.forRoot(
      `${process.env.MONGODB_HOST}:${process.env.MONGODB_POST}/?directConnection=true`,
      {
        dbName: process.env.MONGODB_DB_NAME,
      },
    ),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redis = new KeyvRedis({
          url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASS}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
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
      },
    }),
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
