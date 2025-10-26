import { DatabaseRepository } from './database.repository';
import { Category, CategoryDocument as TDocument } from '../model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryRepository extends DatabaseRepository<Category> {
  constructor(
    @InjectModel(Category.name)
    protected override readonly model: Model<TDocument>,
  ) {
    super(model);
  }
}
