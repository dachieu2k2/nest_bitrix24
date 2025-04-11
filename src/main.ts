import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  MicroserviceOptions,
  RmqStatus,
  Transport,
} from '@nestjs/microservices';
import { MessgaeQueueEnum } from './utils/enum';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  //   AppModule,
  //   {
  //     transport: Transport.RMQ,
  //     options: {
  //       urls: ['amqp://guest:guest@localhost:5672'],
  //       queue: MessgaeQueueEnum.queueName,
  //       queueOptions: {
  //         durable: true,
  //       },
  //     },
  //   },
  // );
  // app.status.subscribe((status: RmqStatus) => {
  //   console.log(status);
  // });
  await app.listen(process.env.PORT ?? 4000);
  // await app.listen();
}
bootstrap();
