import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';
import { MessgaeQueueEnum } from 'src/utils/enum';

@Injectable()
export class ProducerService {
  private channelWrapper: ChannelWrapper;
  constructor() {
    const connection = amqp.connect([`${process.env.RABBIT_MQ_URL}`]);

    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue(MessgaeQueueEnum.queueName, {
          durable: true,
        });
      },
    });
  }
  async addtoMessageQueue(message: any, member_id: string) {
    try {
      await this.channelWrapper.sendToQueue(
        MessgaeQueueEnum.queueName,
        Buffer.from(JSON.stringify({ message, member_id })),
        {
          persistent: true,
        },
      );

      Logger.log('Sent to Queue');
    } catch (error) {
      throw new HttpException(
        'Error adding message to queue',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
