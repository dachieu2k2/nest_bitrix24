import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthBitrixService } from 'src/bitrix24/auth_bitrix/auth.service';

@Injectable()
export class AxiosApiBitrixService {
  client: AxiosInstance;
  constructor(private readonly authService: AuthBitrixService) {
    this.client = axios.create({
      baseURL: process.env.BITRIX_API_URL,
      timeout: 30000,
      timeoutErrorMessage: '🚧🚧🚧 Server connection time out !',

      params: {
        auth: '',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest: AxiosRequestConfig = error?.config;

        console.log(error.config);
        return Promise.reject(error);
      },
    );
  }

  // @Cron('*/5 * * * * *')
  // async handleRefreshToken() {
  //   console.log('run hanndle');
  //   const data = await this.authService.readToken(
  //     '',
  //   );
  //   if (data.refresh_token) {
  //     await this.authService.refreshToken(data);
  //     console.log('RefreshToken successfully!!!');
  //   }
  // }

  request = async (
    options: AxiosRequestConfig,
    additional?: { token?: string },
  ) => {
    this.client.defaults.params['auth'] = additional?.token || '';

    const onSuccess = (response: any) => {
      return response;
    };
    const onError = async (error: any) => {
      console.log(process.env.BITRIX_API_URL, error, options);

      await Promise.reject({
        statusCode: error?.response?.status,
        error: error?.response?.data?.error,
        error_description: error?.response?.data?.error_description,
      });
    };
    return this.client(options).then(onSuccess).catch(onError);
  };

  /**
   * Use for all api
   *
   * @action actions crm.requisite.bankdetail.update, crm.requisite.bankdetail.add, crm.requisite.bankdetail.list
   * @payload payload sent to Bitrix
   * @return return data after call api Bitrix
   */
  // callApiBitrix = async (action: any, payload: any) => {
  //   try {
  //     const { access_token } = await this.authService.readToken('');
  //     const response = await this.request(
  //       { url: `${action}`, method: 'POST', data: payload },
  //       { token: access_token },
  //     );
  //     return response;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
}
