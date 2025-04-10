import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';
import { MessagesService } from 'src/bitrix24/messages/messages.service';
import { MessgaeQueueEnum } from 'src/utils/enum';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConsumerService.name);
  private channelWrapper: ChannelWrapper;
  constructor(private messageService: MessagesService) {
    const connection = amqp.connect([`amqp://localhost`]);
    this.channelWrapper = connection.createChannel();
  }

  async onModuleInit() {
    try {
      await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(MessgaeQueueEnum.queueName, {
          durable: true,
        });
        await channel.consume(MessgaeQueueEnum.queueName, async (message) => {
          if (message) {
            const content = JSON.parse(message.content.toString());
            this.logger.log('Received message:', content);
            await this.messageService.receivedMessage(content);
            channel.ack(message);
          }
        });
      });
      this.logger.log('Consumer service started and listening for messages.');
    } catch (err) {
      this.logger.error('Error starting the consumer:', err);
    }
  }
}
