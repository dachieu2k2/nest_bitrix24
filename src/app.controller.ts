import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AxiosApiService } from './common/api.service';
import { AuthBitrixService } from './bitrix24/auth_bitrix/auth.service';
import { ProducerService } from './queues/producer.service';
import { Bitrix24Service } from './bitrix24/bitrix24.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly axiosApiService: AxiosApiService,
    private readonly authBitrixService: AuthBitrixService,
    private readonly bitrix24Service: Bitrix24Service,
    private producer: ProducerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('install')
  async installApp(@Body() data) {
    await this.authBitrixService.writeToken(
      { install_app: true, is_active: true, ...data?.auth },
      '',
    );

    // create install
    const bodyDataConnect = {
      ID: 'FakeBOOK',
      NAME: 'FakeBOOK',
      member_id: data?.auth.member_id,
      ICON: {
        DATA_IMAGE:
          'data:image/svg+xml;charset=US-ASCII,%3Csvg%20version%3D%221.1%22%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20x%3D%220px%22%20y%3D%220px%22%0A%09%20viewBox%3D%220%200%2070%2071%22%20style%3D%22enable-background%3Anew%200%200%2070%2071%3B%22%20xml%3Aspace%3D%22preserve%22%3E%0A%3Cpath%20fill%3D%22%230C99BA%22%20class%3D%22st0%22%20d%3D%22M34.7%2C64c-11.6%2C0-22-7.1-26.3-17.8C4%2C35.4%2C6.4%2C23%2C14.5%2C14.7c8.1-8.2%2C20.4-10.7%2C31-6.2%0A%09c12.5%2C5.4%2C19.6%2C18.8%2C17%2C32.2C60%2C54%2C48.3%2C63.8%2C34.7%2C64L34.7%2C64z%20M27.8%2C29c0.8-0.9%2C0.8-2.3%2C0-3.2l-1-1.2h19.3c1-0.1%2C1.7-0.9%2C1.7-1.8%0A%09v-0.9c0-1-0.7-1.8-1.7-1.8H26.8l1.1-1.2c0.8-0.9%2C0.8-2.3%2C0-3.2c-0.4-0.4-0.9-0.7-1.5-0.7s-1.1%2C0.2-1.5%2C0.7l-4.6%2C5.1%0A%09c-0.8%2C0.9-0.8%2C2.3%2C0%2C3.2l4.6%2C5.1c0.4%2C0.4%2C0.9%2C0.7%2C1.5%2C0.7C26.9%2C29.6%2C27.4%2C29.4%2C27.8%2C29L27.8%2C29z%20M44%2C41c-0.5-0.6-1.3-0.8-2-0.6%0A%09c-0.7%2C0.2-1.3%2C0.9-1.5%2C1.6c-0.2%2C0.8%2C0%2C1.6%2C0.5%2C2.2l1%2C1.2H22.8c-1%2C0.1-1.7%2C0.9-1.7%2C1.8v0.9c0%2C1%2C0.7%2C1.8%2C1.7%2C1.8h19.3l-1%2C1.2%0A%09c-0.5%2C0.6-0.7%2C1.4-0.5%2C2.2c0.2%2C0.8%2C0.7%2C1.4%2C1.5%2C1.6c0.7%2C0.2%2C1.5%2C0%2C2-0.6l4.6-5.1c0.8-0.9%2C0.8-2.3%2C0-3.2L44%2C41z%20M23.5%2C32.8%0A%09c-1%2C0.1-1.7%2C0.9-1.7%2C1.8v0.9c0%2C1%2C0.7%2C1.8%2C1.7%2C1.8h23.4c1-0.1%2C1.7-0.9%2C1.7-1.8v-0.9c0-1-0.7-1.8-1.7-1.9L23.5%2C32.8L23.5%2C32.8z%22/%3E%0A%3C/svg%3E%0A',
        COLOR: '#1900ff',
        SIZE: '90%',
        POSITION: 'center',
      },
      PLACEMENT_HANDLER:
        process.env.BITRIX_REDIRECT_DOMAIN + '/handle_chat_app',
    };

    await this.bitrix24Service.callApiBitrix24(
      'imconnector.register',
      bodyDataConnect,
    );

    return { status: 'success' };
  }

  @Get('install')
  async getistallApp(@Body() data) {
    return { status: 'success' };
  }

  // hanle placement
  @Post('handle_chat_app')
  async handleChatAppEvent(@Body() body) {
    try {
      const { member_id, PLACEMENT_OPTIONS } = body;

      const setupApp = JSON.parse(PLACEMENT_OPTIONS);

      const response = await this.bitrix24Service.callApiBitrix24(
        'imconnector.activate',
        {
          member_id,
          CONNECTOR: setupApp?.CONNECTOR,
          LINE: setupApp?.LINE,
          ACTIVE: setupApp?.ACTIVE_STATUS ? 1 : 0,
        },
      );

      const registerEventBody = {
        event: 'OnImConnectorMessageAdd',
        member_id,
        handler:
          `${process.env.BITRIX_REDIRECT_DOMAIN}/handle_messages/` + member_id,
      };

      const unbindEventData = await this.bitrix24Service.callApiBitrix24(
        'event.unbind.json',
        registerEventBody,
      );

      const registerEventData = await this.bitrix24Service.callApiBitrix24(
        'event.bind.json',
        registerEventBody,
      );

      return {
        message: 'success',
        data: response.data,
        connected: registerEventData?.data,
        unbind: unbindEventData?.data,
      };
    } catch (error) {
      console.log(error);
    }
  }

  @Post('handle_messages/:member_id')
  async handleListenMessagesEvent(
    @Body() body,
    @Param('member_id') member_id: string,
  ) {
    try {
      // console.log('post-handle_chat_app', body?.data?.MESSAGES);

      await this.producer.addtoMessageQueue(body?.data?.MESSAGES, member_id);

      return { message: 'success', data: body };
    } catch (error) {
      console.log(error);
    }
  }

  // hanle placement
  @Get('handle_chat_app')
  async handleChatApp(@Body() body) {
    try {
      const setupApp = JSON.parse(body.PLACEMENT_OPTIONS);

      const response = await this.bitrix24Service.callApiBitrix24(
        'imconnector.activate',
        {
          CONNECTOR: setupApp?.CONNECTOR,
          LINE: setupApp?.LINE,
          ACTIVE: setupApp?.ACTIVE_STATUS ? 1 : 0,
        },
      );
      return { message: 'success', data: response.data };
    } catch (error) {
      console.log(error);
    }
  }

  @Post('handler')
  handlerApp(@Body() body) {
    console.log('post run handler', body);

    return { messsage: 'successs' };
  }

  @Get('handler')
  getHandlerApp(@Body() body) {
    console.log('get run handler', body);
    return { messsage: 'successs' };
  }
}
