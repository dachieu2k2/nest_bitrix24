import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuthDocument = Auth & Document;

@Schema({ timestamps: true })
export class Auth {
  @Prop()
  access_token: string;

  @Prop()
  refresh_token: string;

  @Prop()
  expires: string;

  @Prop()
  expires_in: string;

  @Prop()
  scope: string;

  @Prop()
  domain: string;

  @Prop()
  server_endpoint: string;

  @Prop()
  status: string;

  @Prop()
  client_endpoint: string;

  @Prop()
  member_id: string;

  @Prop({ unique: true })
  user_id: string;

  @Prop()
  application_token: string;

  @Prop()
  install_app: boolean;

  @Prop()
  is_active: boolean;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);
