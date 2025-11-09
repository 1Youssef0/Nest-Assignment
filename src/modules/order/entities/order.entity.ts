import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import {
  IOrder,
  IOrderProduct,
  IToken,
  type IUser,
  OrderStatusEnum,
  PaymentEnum,
} from 'src/common';

export class OrderResponse {
  order: IOrder;
}

registerEnumType(PaymentEnum, {
  name: 'PaymentEnum',
});

registerEnumType(OrderStatusEnum, {
  name: 'OrderStatusEnum',
});

@ObjectType()
export class OneOrderProductResponse implements IOrderProduct {
  @Field(() => ID)
  _id?: Types.ObjectId;

  @Field(() => ID)
  productId: Types.ObjectId;

  @Field(() => String)
  name: string;

  @Field(() => ID)
  intentId?: string;

  @Field(() => Number, { nullable: false })
  quantity: number;

  @Field(() => Number, { nullable: false })
  unitPrice: number;

  @Field(() => Number, { nullable: false })
  finalPrice: number;

  @Field(() => Date, { nullable: false })
  createdAt?: Date;

  @Field(() => Date, { nullable: false })
  updatedAt?: Date;
}

@ObjectType({ description: 'one order response' })
export class OneOrderResponse implements IOrder {
  @Field(() => ID)
  _id?: Types.ObjectId;

  @Field(() => String)
  orderId: string;

  @Field(() => String)
  address: string;

  @Field(() => String)
  phone: string;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => Number, { nullable: true })
  discount?: number;
  @Field(() => Number, { nullable: true })
  subtotal: number;
  @Field(() => Number, { nullable: true })
  total: number;

  @Field(() => PaymentEnum)
  paymentType: PaymentEnum;

  @Field(() => String)
  status: OrderStatusEnum;


  @Field(() => [OneOrderProductResponse])
  products: IOrderProduct[];

  @Field(() => OneOrderResponse)
  createdBy: IUser;

  @Field(() => ID, { nullable: true })
  updatedBy?: Types.ObjectId;

  @Field(() => Date, { nullable: true })
  freezedAt?: Date;
  @Field(() => Date, { nullable: true })
  restoredAt?: Date;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;
  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}

@ObjectType({ description: 'include paginated response contain orders' })
export class GetAllOrdersResponse {
  @Field(() => Number, { nullable: true })
  docsCount?: number;
  @Field(() => Number, { nullable: true })
  limit?: number;
  @Field(() => Number, { nullable: true })
  pages?: number;
  @Field(() => Number, { nullable: true })
  currentPage?: number;

  @Field(() => [OneOrderResponse])
  result: IToken[];
}
