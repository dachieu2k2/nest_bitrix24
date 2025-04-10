import { Inject, Injectable } from '@nestjs/common';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Token } from './models/auth.model';
import axios from 'axios';
import { join } from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Auth, AuthDocument } from './schemas/auth.schema';
import { Model } from 'mongoose';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheKey } from 'src/utils/enum';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthBitrixService {
  TOKEN_FILE = join(process.cwd(), 'tokens.json');

  constructor(
    @InjectModel(Auth.name) private readonly AuthModel: Model<AuthDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async readToken() {
    const cachedData = await this.cacheManager.get(CacheKey.auth);
    if (cachedData) {
      console.log('Load from cached', cachedData);
      return cachedData as CreateAuthDto;
    }
    console.log('Fetching data from database...');
    const token = (await this.AuthModel.findOne(
      {},
    )) as unknown as CreateAuthDto;
    await this.cacheManager.set(CacheKey.auth, token, 1000 * 60 * 60);
    return token as CreateAuthDto;
  }

  async createTokenFirtTime() {
    return this.AuthModel.create();
  }

  async writeToken(token: UpdateAuthDto) {
    const tokenSaved = await this.AuthModel.findOneAndUpdate({}, token, {
      new: true,
      upsert: true,
    });
    await this.cacheManager.set(CacheKey.auth, tokenSaved, 1000 * 60 * 60);
    return tokenSaved;
  }

  async refreshToken(refresh_token: string) {
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
        await this.writeToken({
          access_token: response.data.access_token as unknown as string,
          refresh_token: response.data.refresh_token as unknown as string,
        } as unknown as Token);
      }

      return { access_token: response.data?.access_token };
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // Outdate
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

  // Outdate
  writeFileTokenJson = (token: Token) => {
    writeFileSync(this.TOKEN_FILE, JSON.stringify(token, null, 2), 'utf8');
  };
}
