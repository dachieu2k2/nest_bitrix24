import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { AxiosApiService } from 'src/common/api.service';
import { Bitrix24Service } from './bitrix24.service';
import {
  CACHE_MANAGER,
  CacheInterceptor,
  CacheKey,
  CacheTTL,
} from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HttpExceptionFilter } from './exception/http-exception.filter';

@Controller('bitrix24')
export class Bitrix24Controller {
  constructor(
    private readonly bitrixService: Bitrix24Service,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @UseFilters(HttpExceptionFilter)
  @Get('/hellow')
  getHello() {
    throw new ForbiddenException();
  }

  @Get('cmd/:cmd')
  async getListContacts(@Param('cmd') cmd: string, @Query() allData: object) {
    const response = await this.bitrixService.callApiBitrix24(cmd, {
      ...allData,
    });

    // console.log(response?.data);

    return { hello: 'world', data: response?.data };
  }

  @UseInterceptors(CacheInterceptor)
  @Get('/test-save-redis')
  async testRedis() {
    const data = await this.cacheManager.get('ddd');

    const data2 = await this.cacheManager.get('contacts_list');

    console.log('run here tooo');

    return { data, data2 };
  }

  @UseInterceptors(CacheInterceptor)
  @Get('/test-redis')
  async testSetRedis() {
    await this.cacheManager.set('ddd', 'hellow');

    console.log('run here');

    return {};
  }

  @Get('/users')
  async getUsers() {
    const response = await this.bitrixService.callApiBitrix24(
      'user.current',
      {},
    );
    console.log('run here');
    console.log(response.data);

    return { currentUser: response.data };
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(10000)
  @CacheKey('contacts')
  @Get('/current')
  async getCurrentUser() {
    const data = await this.bitrixService.callApiBitrix24(
      'crm.contact.list',
      {},
    );
    console.log('run here');

    this.cacheManager.set('contacts_list', data.data?.result);

    return { data: data.data?.result };
  }
}
