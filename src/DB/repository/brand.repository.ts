import { DatabaseRepository } from './database.repository';
import { Brand, BrandDocument as TDocument } from '../model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BrandRepository extends DatabaseRepository<Brand> {
  constructor(
    @InjectModel(Brand.name)
    protected override readonly model: Model<TDocument>,
  ) {
    super(model);
  }
}
