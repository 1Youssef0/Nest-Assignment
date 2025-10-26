import { DatabaseRepository } from './database.repository';
import { Product, ProductDocument as TDocument } from '../model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductRepository extends DatabaseRepository<Product> {
  constructor(
    @InjectModel(Product.name)
    protected readonly model: Model<TDocument>,
  ) {
    super(model);
  }
}
 