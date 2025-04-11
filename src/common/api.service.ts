import { Inject, Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { AuthBitrixService } from 'src/bitrix24/auth_bitrix/auth.service';

export interface RetryQueueItem {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
  config: AxiosRequestConfig;
}

@Injectable()
export class AxiosApiService {
  client: AxiosInstance;
  refreshAndRetryQueue: RetryQueueItem[] = [];
  isRefreshing = false;
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
        console.log('error interceptor', error);

        if (error.response && error.response.status === 401) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const data = await authService.readToken('');
              if (data.refresh_token) {
                const token = await authService.refreshToken(data);
                if (token && token.access_token) {
                  originalRequest.params['auth'] = token.access_token;
                  return this.client(originalRequest);
                }
                // Repeat all miss request by 401
                this.refreshAndRetryQueue.forEach(
                  ({ config, resolve, reject }) => {
                    this.client(config)
                      .then((response) => resolve(response))
                      .catch((err) => reject(err));
                  },
                );
                this.refreshAndRetryQueue.length = 0;
              } else {
                return Promise.reject(error);
              }
            } catch (refreshError) {
              this.refreshAndRetryQueue.length = 0;
            } finally {
              this.isRefreshing = false;
            }
          }
          return new Promise<void>((resolve, reject) => {
            this.refreshAndRetryQueue.push({
              config: originalRequest,
              resolve,
              reject,
            });
          });
        }

        return Promise.reject(error);
      },
    );
  }

  request = async (
    options: AxiosRequestConfig,
    additional?: { token?: string },
  ) => {
    this.client.defaults.params['auth'] = additional?.token || '';

    const onSuccess = (response: any) => {
      return response;
    };
    const onError = async (error: any) => {
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
  //     const { access_token } = await this.authService.readToken(
  //       '',
  //     );
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
