import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Token } from './models/auth.model';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Auth, AuthDocument } from './schemas/auth.schema';
import { Model } from 'mongoose';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheKey } from 'src/utils/enum';
import { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class AuthBitrixService implements OnModuleInit {
  private allDataNeedRefresh = [];

  constructor(
    @InjectModel(Auth.name) private readonly AuthModel: Model<AuthDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    this.allDataNeedRefresh = await this.AuthModel.find({
      $or: [{ install_app: true }],
    }).select(['refresh_token', 'member_id']);
  }

  async readToken(memberId: string) {
    const cachedData = await this.cacheManager.get(
      CacheKey.auth + ':' + memberId,
    );
    if (cachedData) {
      console.log('Load from cached', cachedData);
      return cachedData as CreateAuthDto;
    }
    console.log('Fetching data from database...');
    const token = (await this.AuthModel.findOne({
      member_id: memberId,
    })) as unknown as CreateAuthDto;
    await this.cacheManager.set(
      CacheKey.auth + ':' + memberId,
      token,
      1000 * 60 * 60,
    );
    return token as CreateAuthDto;
  }

  async createTokenFirtTime() {
    return this.AuthModel.create();
  }

  async writeToken(token: UpdateAuthDto, memberId: string) {
    const tokenSaved = await this.AuthModel.findOneAndUpdate(
      { member_id: token?.member_id ? token.member_id : memberId },
      token,
      {
        new: true,
      },
    );
    await this.cacheManager.set(
      CacheKey.auth + ':' + memberId,
      tokenSaved,
      1000 * 60 * 60,
    );
    return tokenSaved;
  }

  @Cron('* */50 * * * *')
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async handleRefreshToken() {
    console.log('refresh_token');
    try {
      await Promise.all(
        this.allDataNeedRefresh.map((value) => {
          this.refreshToken(value);
        }),
      );
      console.log('RefreshToken successfully!!!');
    } catch (error) {
      throw new Error('Tokens did not refresh!!!');
    }
  }

  async refreshToken({ refresh_token, member_id }: CreateAuthDto) {
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
        await this.writeToken(
          {
            access_token: response.data.access_token as unknown as string,
            refresh_token: response.data.refresh_token as unknown as string,
          } as unknown as Token,
          member_id,
        );
      }

      return { access_token: response.data?.access_token };
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
