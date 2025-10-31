import { Types } from 'mongoose';
import { IUser } from './user.interface';
import { IProduct } from './product.interface';
import { OrderStatusEnum, PaymentEnum } from '../enums';

export interface IOrderProduct {
  _id?: Types.ObjectId;

  productId: Types.ObjectId | IProduct;
  name: string;
  intentId?: string;
  quantity: number;
  unitPrice: number;
  finalPrice: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder {
  _id?: Types.ObjectId;
  orderId: string;
  address: string;
  phone: string;
  note?: string;

  products: IOrderProduct[];

  subtotal: number;
  discount?: number;
  total: number;

  paymentType: PaymentEnum;
  status: OrderStatusEnum;
  cancelReason?: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  freezedAt?: Date;
  restoredAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
