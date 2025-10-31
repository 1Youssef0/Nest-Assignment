import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, UpdateQuery } from 'mongoose';
import { ICart, ICartProduct } from 'src/common';

@Schema({ timestamps: true, strictQuery: true })
export class CartProduct implements ICartProduct {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  quantity: number;
}

@Schema({ timestamps: true, strictQuery: true })
export class Cart implements ICart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true ,unique:true })
  createdBy: Types.ObjectId;

  @Prop([CartProduct])
  products: CartProduct[];
}

export type CartProductDocument = HydratedDocument<CartProduct>;
export type CartDocument = HydratedDocument<Cart>;


const CartSchema = SchemaFactory.createForClass(Cart);
CartSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

export const CartModel = MongooseModule.forFeature([
  { name: Cart.name, schema: CartSchema },
]);
