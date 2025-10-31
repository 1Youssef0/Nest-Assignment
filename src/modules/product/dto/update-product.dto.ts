// import { PartialType } from '@nestjs/mapped-types';
// import { CreateProductDto } from './create-product.dto';

import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { ContainField } from 'src/common';
import { CreateProductDto } from './create-product.dto';

@ContainField()
export class UpdateProductDto extends PartialType(CreateProductDto) {}


export class UpdateProductAttachmentDto {
  @IsArray()
  @IsOptional()
  removeAttachments?: string[];
}

export class ProductParamDto {
  @IsMongoId()
  productId: Types.ObjectId;
}
