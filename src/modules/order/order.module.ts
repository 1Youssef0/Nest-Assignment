import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CartModel, CartRepository, OrderModel, OrderRepository, ProductModel, ProductRepository } from 'src/DB';
import { CartService } from '../cart/cart.service';
import { PaymentService } from 'src/common/services';

@Module({
  imports:[ProductModel , CartModel,OrderModel],
  controllers: [OrderController],
  providers: [OrderService , CartRepository , ProductRepository , OrderRepository , CartService , PaymentService ],
})
export class OrderModule {}
