import { Module } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { ConsumerService } from './cunsumer.service';
import { Bitrix24Module } from 'src/bitrix24/bitrix24.module';

@Module({
  imports: [Bitrix24Module],
  providers: [ProducerService, ConsumerService],
  exports: [ProducerService],
})
export class QueueModule {}
