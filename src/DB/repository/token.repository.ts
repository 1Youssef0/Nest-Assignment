import { DatabaseRepository } from './database.repository';
import { TokenDocument , Token } from '../model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';


@Injectable()
export class TokenRepository extends DatabaseRepository<Token> {
  constructor(
    @InjectModel(Token.name) protected override readonly model: Model<TokenDocument>,
  ) {
    super(model);
  }
}
