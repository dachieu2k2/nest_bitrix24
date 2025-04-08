import { Controller, Get } from '@nestjs/common';
import { AxiosApiService } from 'src/common/api.service';

@Controller('bitrix24')
export class Bitrix24Controller {
  constructor(private readonly axiosApiService: AxiosApiService) {}

  @Get()
  async getListContacts() {
    const response = await this.axiosApiService.callApiBitrix(
      'crm.contact.list',
      {},
    );

    console.log(response?.data);

    return { hello: 'world', data: response?.data };
  }
}
