import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom, retry } from 'rxjs';
import { AuthBitrixService } from './auth_bitrix/auth.service';
import * as dns from 'dns/promises';

@Injectable()
export class Bitrix24Service {
  private readonly logger = new Logger(Bitrix24Service.name);
  private requestConfig: AxiosRequestConfig = {
    params: {
      auth: '',
    },
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly authBitrixService: AuthBitrixService,
    private readonly authService: AuthBitrixService,
  ) {}

  private async checkInternet(): Promise<void> {
    try {
      await dns.lookup('google.com');
    } catch (err) {
      throw new InternalServerErrorException('No internet connection');
    }
  }

  /**
   * Call api bitrix to get data
   * @param action crm.contact,get
   * @param payload data example {username:'asd'}
   * @returns data from bitrix24
   */
  async callApiBitrix24(action: string, { member_id, ...payload }: any) {
    const { access_token } = await this.authBitrixService.readToken(member_id);
    this.requestConfig.params['auth'] = access_token;
    return firstValueFrom(
      this.httpService.post(action, payload, this.requestConfig).pipe(
        catchError(async (error: AxiosError) => {
          await this.checkInternet();
          this.logger.error(error.response?.data);
          console.log(error);

          throw 'An error happened';
        }),

        retry(3),
      ),
    );
  }

  findUser() {
    return firstValueFrom(
      this.httpService.post('user.current').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response?.data);
          throw 'An error happened';
        }),
      ),
    );
  }
}
