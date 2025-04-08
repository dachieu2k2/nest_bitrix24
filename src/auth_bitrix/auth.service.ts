import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Token } from './models/auth.model';
import axios from 'axios';
import { join } from 'path';

@Injectable()
export class AuthBitrixService {
  TOKEN_FILE = join(process.cwd(), 'tokens.json');

  constructor() {}

  readFileTokenJson = (): Token => {
    if (!existsSync(this.TOKEN_FILE))
      return {
        access_token: '',
        refresh_token: '',
        token: '',
      };

    const token = readFileSync(this.TOKEN_FILE, 'utf8');
    const data = JSON.parse(token) as Token;
    return data;
  };

  writeFileTokenJson = (token: Token) => {
    writeFileSync(this.TOKEN_FILE, JSON.stringify(token, null, 2), 'utf8');
  };

  getTokenFirstTime = async (code: string) => {
    try {
      const response = await axios.post<Token>(
        process.env.BITRIX_OAUTH_URL + '',
        null,
        {
          params: {
            client_id: process.env.CLIENT_ID + '',
            client_secret: process.env.CLIENT_SECRET + '',
            grant_type: 'authorization_code',
            code: code,
          },
        },
      );

      if (response.data) {
        this.writeFileTokenJson({
          access_token: response.data?.access_token,
          refresh_token: response.data?.refresh_token,
        } as unknown as Token);
      }

      return { access_token: response.data.access_token } as Token;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  refreshToken = async (refresh_token: string) => {
    try {
      const response = await axios.post(
        process.env.BITRIX_OAUTH_URL + '',
        null,
        {
          params: {
            client_id: process.env.CLIENT_ID + '',
            client_secret: process.env.CLIENT_SECRET + '',
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
          },
        },
      );

      if (response.data) {
        this.writeFileTokenJson({
          access_token: response.data.access_token as unknown as string,
          refresh_token: response.data.refresh_token as unknown as string,
        } as unknown as Token);
      }

      return { access_token: response.data?.access_token };
    } catch (error) {
      console.error(error);
      return null;
    }
  };
}
