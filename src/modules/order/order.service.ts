import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  CartRepository,
  OrderDocument,
  OrderRepository,
  ProductDocument,
  ProductRepository,
  UserDocument,
} from 'src/DB';
import { IOrderProduct, OrderStatusEnum, PaymentEnum } from 'src/common';
import { randomUUID } from 'crypto';
import { CartService } from '../cart/cart.service';
import { PaymentService } from 'src/common/services';
import { Types } from 'mongoose';
import Stripe from 'stripe';
import type{ Request } from 'express';

@Injectable()
export class OrderService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly cartService: CartService,
  ) {}


  async webhook(req:Request){
   const event =  await this.paymentService.webhook(req)
   const {orderId} = event.data.object.metadata as {orderId : string}
   const order = await this.orderRepository.findOneAndUpdate({
    filter:{
      _id:Types.ObjectId.createFromHexString(orderId),
      status:OrderStatusEnum.Pending,
      paymentType:PaymentEnum.Card
    },
    update:{
      paidAt:new Date(),
      status:OrderStatusEnum.Placed
    }
   })
   if (!order) {
    throw new NotFoundException("fail to find matching order")
   }

   await this.paymentService.confirmPaymentIntent(order.intentId)
  }



  async create(
    createOrderDto: CreateOrderDto,
    user: UserDocument,
  ): Promise<OrderDocument> {
    const cart = await this.cartService.findOne(user);
    if (!cart?.products?.length) {
      throw new BadRequestException('user cart is empty');
    }
    let total: number = 0;
    const products: IOrderProduct[] = [];
    for (const product of cart.products) {
      const checkProduct = await this.productRepository.findOne({
        filter: { _id: product.productId, stock: { $gte: product.quantity } },
      });
      if (!checkProduct) {
        throw new BadRequestException(
          `fail to find matching product  id ::${product.productId} or out of stock`,
        );
      }
      const finalPrice = product.quantity * checkProduct.salePrice;
      products.push({
        name: checkProduct.name,
        productId: checkProduct._id,
        quantity: product.quantity,
        unitPrice: checkProduct.salePrice,
        finalPrice,
      });
      total += finalPrice;
    }
 
    const [order] = await this.orderRepository.create({
      data: [
        {
          ...createOrderDto,
          orderId: randomUUID().slice(0, 8),
          total,
          products,
          createdBy: user._id,
        },
      ],
    });

    if (!order) {
      throw new BadRequestException('fail to create this order instance');
    }

    for (const product of cart.products) {
      await this.productRepository.updateOne({
        filter: { _id: product.productId },
        update: { $inc: { __v: 1, stock: -product.quantity } },
      });
    }

    await this.cartService.remove(user);

    return order;
  }



  async cancel(
  orderId: Types.ObjectId,
  user: UserDocument,
): Promise<OrderDocument> {
  const order = await this.orderRepository.findOneAndUpdate({
    filter: {
      _id: orderId,
      status: { $ne: OrderStatusEnum.Canceled },
    },
    update: {
      status: OrderStatusEnum.Canceled,
      updatedBy: user._id,
    },
    options: { new: true },
  });

  if (!order) {
    throw new NotFoundException('fail to find matching order');
  }

  if (order.paymentType === PaymentEnum.Card && order.intentId) {
    await this.paymentService.cancelPaymentIntent(order.intentId);
  }

  for (const item of order.products) {
    await this.productRepository.updateOne({
      filter: { _id: item.productId },
      update: { $inc: { stock: item.quantity } },
    });
  }

  

  return order as OrderDocument;
}



  async checkout(orderId: Types.ObjectId, user: UserDocument) {
    const order = await this.orderRepository.findOne({
      filter: {
        _id: orderId,
        createdBy: user._id,
        paymentType: PaymentEnum.Card,
        status: OrderStatusEnum.Pending,
      },
      options: {
        populate: [{ path: 'products.productId', select: 'name' }],
      },
    });

    if (!order) {
      throw new NotFoundException('fail to find matching order');
    }

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];

    if (order.discount) {
      const coupon = await this.paymentService.createCoupon({
        duration: 'once',
        currency: 'egp',
        percent_off: order.discount * 100,
      });

      discounts.push({ coupon: coupon.id }); 
    }

    const session = await this.paymentService.checkoutSession({
      customer_email: user.email,
      metadata: { orderId: orderId.toString() },
      discounts,
      line_items: order.products.map((product) => {
        return {
          quantity: product.quantity,
          price_data: {
            currency: 'egp',
            product_data: {
              name: (product.productId as ProductDocument).name,
            },
            unit_amount: product.unitPrice * 100,
          },
        };
      }),
    });



    const method = await this.paymentService.createPaymentMethod({
      type:"card",
      card:{
        token:"tok_visa"
      }
    })


    const intent = await this.paymentService.createPaymentIntent({
      amount:order.subtotal * 100,
      currency:'egp',
      payment_method:method.id,
      automatic_payment_methods:{
        enabled:true,
        allow_redirects:"never"
      }
    })

    order.intentId = intent.id
    await order.save()

    return session.url as string;
  }

  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
