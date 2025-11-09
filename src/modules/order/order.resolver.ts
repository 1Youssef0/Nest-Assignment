import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { OrderService } from './order.service';
import { GetAllOrdersResponse } from './entities/order.entity';
import { Auth, GetAllGraphDto, RoleEnum, User } from 'src/common';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthenticationGuard } from 'src/common/guards/authentication/authentication.guard';
import {type UserDocument } from 'src/DB';


@UsePipes(new ValidationPipe({whitelist:true , forbidNonWhitelisted:true}))
@Resolver()
export class OrderResolver {
  constructor(private readonly orderService:OrderService) {}



  @Auth([RoleEnum.admin])
  @Query(()=> GetAllOrdersResponse , {name:"allOrders" , description:"retrieve all orders"})
  async allOrders(@User() user:UserDocument,@Args("data",{nullable:true}) getAllGraphDto?:GetAllGraphDto){
    const result = await this.orderService.findAll( getAllGraphDto, false )
    console.log({result});
    
    return result
    
  }

  @Query(() => String, { deprecationReason: 'first welcome point' })
  sayHi() {
    return `hello graphQl with nestjs`;
  }


    @Mutation(() => String, { deprecationReason: 'first welcome point' })
  updateOrder():string {
    return `order`;
  }
}
