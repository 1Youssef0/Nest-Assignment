import { IsEnum, IsMongoId, IsOptional, IsString, Matches } from 'class-validator';
import { Types } from 'mongoose';
import { IOrder, PaymentEnum } from 'src/common';



export class OrderParamDto{
    @IsMongoId()
    orderId:Types.ObjectId
}
export class CreateOrderDto implements Partial<IOrder> {
  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  note: string;

  @Matches(/^(002|\+2)?01[0125][0-9]{8}$/)
  @IsString()
  phone: string;

  @IsEnum(PaymentEnum)
  paymentType?: PaymentEnum;
}
