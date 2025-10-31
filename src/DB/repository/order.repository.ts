import { DatabaseRepository } from './database.repository';
import { Order, OrderDocument as TDocument } from '../model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OrderRepository extends DatabaseRepository<Order> {
  constructor(
    @InjectModel(Order.name)
    protected override readonly model: Model<TDocument>,
  ) {
    super(model);
  }
}
