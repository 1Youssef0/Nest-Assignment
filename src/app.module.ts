import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { join, resolve } from 'path';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedAuthenticationModule } from './common/modules/auth.module';
import { S3Service } from './common/services';
import { BrandModule } from './modules/brand/brand.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { RealtimeModule } from './modules/gateway/gateway.module';
import { CacheModule } from "@nestjs/cache-manager";
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';




@Module({
  imports: [
  ConfigModule.forRoot({
      envFilePath: resolve('./config/.env.development'),
      isGlobal: true,
    }),
    // CacheModule.register({
    //   ttl:5000,
    //   isGlobal:true
    // }),
    MongooseModule.forRoot(process.env.DB_URI as string, {
      serverSelectionTimeoutMS: 30000,
    }),
    


    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver:ApolloDriver,
      graphiql:true,
      autoSchemaFile:join(process.cwd(),`src/schema.gql`)
    }),
    
    SharedAuthenticationModule,
    AuthenticationModule,
    UserModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    CartModule,
    OrderModule,
    RealtimeModule,
    
  ],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
