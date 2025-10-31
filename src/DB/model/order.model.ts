import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  IOrder,
  IOrderProduct,
  OrderStatusEnum,
  PaymentEnum,
} from 'src/common';

@Schema({ timestamps: true, strictQuery: true })
export class OrderProduct implements IOrderProduct {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Number, required: true })
  unitPrice: number;

  @Prop({ type: Number, required: true })
  finalPrice: number;
}

@Schema({ timestamps: true, strictQuery: true })
export class Order implements IOrder {
  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: String })
  cancelReason?: string;

  @Prop({ type: String })
  note?: string;

  @Prop({ type: String })
  intentId: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Number })
  discount?: number;

  @Prop({ type: Number, required: true })
  total: number;

  @Prop({ type: Number })
  subtotal: number;

  @Prop({ type: Date })
  freezedAt?: Date;

  @Prop({ type: Date })
  restoredAt?: Date;

  @Prop({ type: String, required: true })
  orderId: string;

  @Prop({ type: String, enum: PaymentEnum, default: PaymentEnum.Cash })
  paymentType: PaymentEnum;

  @Prop({
    type: String,
    enum: OrderStatusEnum,
    default: function (this: Order) {
      return this.paymentType === PaymentEnum.Card
        ? OrderStatusEnum.Pending
        : OrderStatusEnum.Placed;
    },
  })
  status: OrderStatusEnum;

  @Prop([OrderProduct])
  products: IOrderProduct[];
}

export type OrderProductDocument = HydratedDocument<OrderProduct>;

export type OrderDocument = HydratedDocument<Order>;
const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.pre('save', function (next) {
  if (this.isModified('total')) {
    this.subtotal = this.total - this.total * ((this.discount ?? 0) / 100);
  }
  next()
});

export const OrderModel = MongooseModule.forFeature([
  { name: Order.name, schema: OrderSchema },
]);
