import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import {
  UpdateProductAttachmentDto,
  UpdateProductDto,
} from './dto/update-product.dto';
import {
  BrandRepository,
  CategoryDocument,
  CategoryRepository,
  ProductDocument,
  UserDocument,
  UserRepository,
} from 'src/DB';
import { ProductRepository } from 'src/DB/repository/product.repository';
import { S3Service } from 'src/common/services';
import { FolderEnum, GetAllDto } from 'src/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { lean } from 'src/DB/repository/database.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly brandRepository: BrandRepository,
    private readonly productRepository: ProductRepository,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    user: UserDocument,
  ): Promise<ProductDocument> {
    const { name, originalPrice, description, discountPercent, stock } =
      createProductDto;
    const category = await this.productRepository.findOne({
      filter: { _id: createProductDto.category },
    });
    if (!category) {
      throw new NotFoundException('Fail to find matching category instance');
    }

    const brand = await this.brandRepository.findOne({
      filter: { _id: createProductDto.brand },
    });
    if (!brand) {
      throw new NotFoundException('Fail to find matching brand instance');
    }

    let assetFolderId = randomUUID();
    const images = await this.s3Service.uploadFiles({
      files,
      path: `${FolderEnum.Category}/${createProductDto.category}/${FolderEnum.Product}/${assetFolderId}`,
    });

    const [product] = await this.productRepository.create({
      data: [
        {
          name,
          originalPrice,
          description,
          discountPercent,
          stock,
          category: category._id,
          brand: brand._id,
          assetFolderId,
          images,
          createdBy: user._id,
          salePrice: originalPrice - originalPrice * (discountPercent / 100),
        },
      ],
    });

    if (!product) {
      throw new BadRequestException('fail to create this product instance');
    }

    return product;
  }

  async update(
    productId: Types.ObjectId,
    updateProductDto: UpdateProductDto,
    user: UserDocument,
  ): Promise<ProductDocument> {
    const product = await this.productRepository.findOne({
      filter: { _id: productId },
    });
    if (!product) {
      throw new NotFoundException('failed to find matching product instance');
    }
    if (updateProductDto.category) {
      const category = await this.productRepository.findOne({
        filter: { _id: updateProductDto.category },
      });
      if (!category) {
        throw new NotFoundException('Fail to find matching category instance');
      }
      updateProductDto.category = category._id;
    }

    if (updateProductDto.brand) {
      const brand = await this.brandRepository.findOne({
        filter: { _id: updateProductDto.brand },
      });
      if (!brand) {
        throw new NotFoundException('Fail to find matching brand instance');
      }
      updateProductDto.brand = brand._id;
    }

    let salePrice = product.salePrice;
    if (updateProductDto.originalPrice || updateProductDto.discountPercent) {
      const originalPrice =
        updateProductDto.originalPrice ?? product.originalPrice;
      const discountPercent =
        updateProductDto.discountPercent ?? product.discountPercent;
      const finalPrice =
        originalPrice - originalPrice * (discountPercent / 100);
      salePrice = finalPrice > 0 ? finalPrice : 1;
    }

    const updateProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        ...updateProductDto,
        salePrice,
        updatedBy: user._id,
      },
    });

    if (!updateProduct) {
      throw new BadRequestException('fail to update this product instance');
    }

    return updateProduct;
  }

  async updateAttachment(
    productId: Types.ObjectId,
    updateProductAttachmentDto: UpdateProductAttachmentDto,
    user: UserDocument,
    files?: Express.Multer.File[],
  ): Promise<ProductDocument> {
    const product = await this.productRepository.findOne({
      filter: { _id: productId },
      options: {
        populate: [
          {
            path: 'category',
          },
        ],
      },
    });
    if (!product) {
      throw new NotFoundException('failed to find matching product instance');
    }

    let attachments: string[] = [];
    if (files?.length) {
      attachments = await this.s3Service.uploadFiles({
        files,
        path: `${FolderEnum.Category} / ${(product.category as unknown as CategoryDocument).assetFolderId}/${FolderEnum.Product}/${product.assetFolderId}`,
      });
    }

    const removeAttachments = [
      ...new Set(updateProductAttachmentDto.removeAttachments ?? []),
    ];

    const updateProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: [
        {
          $set: {
            updatedBy: user._id,
            images: {
              $setUnion: [
                {
                  $setDifference: ['$images', removeAttachments],
                },
                attachments,
              ],
            },
          },
        },
      ],
    });

    if (!updateProduct) {
      await this.s3Service.deleteFiles({ urls: attachments });
      throw new BadRequestException('fail to update this product instance');
    }

    await this.s3Service.deleteFiles({ urls: removeAttachments });

    return updateProduct;
  }

  async freeze(productId: Types.ObjectId, user: UserDocument): Promise<string> {
    const Category = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false,
      },
    });

    if (!Category) {
      throw new NotFoundException('fail to find matching Category instance');
    }

    return 'done';
  }

  async restore(
    categoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<string> {
    const category = await this.productRepository.findOneAndUpdate({
      filter: {
        _id: categoryId,
        paranoId: false,
        freezedAt: { $exists: true },
      },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: true },
        updatedBy: user._id,
      },
      options: {
        new: false,
      },
    });

    if (!category) {
      throw new NotFoundException('fail to find matching category instance');
    }

    return 'done';
  }

  async remove(productId: Types.ObjectId, user: UserDocument): Promise<string> {
    const product = await this.productRepository.findOneAndDelete({
      filter: {
        _id: productId,
        paranoId: false,
        freezedAt: { $exists: true },
      },
    });

    if (!product) {
      throw new NotFoundException('fail to find matching product instance');
    }
    await this.s3Service.deleteFiles({ urls: product.images });
    return 'done';
  }

  async findAll(
    data: GetAllDto,
    archive: boolean = false,
  ): Promise<{
    docsCount?: number;
    pages?: number;
    limit?: number;
    currentPage?: number | undefined;
    result: ProductDocument[] | lean<ProductDocument>[];
  }> {
    const { page, size, search } = data;
    const result = await this.productRepository.paginate({
      filter: {
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {}),
      },
      page,
      size,
    });
    return result;
  }

  async findOne(
    productId: Types.ObjectId,
    archive: boolean = false,
  ): Promise<ProductDocument | lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {}),
      },
    });
    if (!product) {
      throw new NotFoundException('Fail to finds matching product instance');
    }
    return product;
  }

  async addToWishlist(
    productId: Types.ObjectId,
    user: UserDocument,
  ): Promise<ProductDocument | lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
      },
    });
    if (!product) {
      throw new NotFoundException('Fail to finds matching product instance');
    }

    await this.userRepository.updateOne({
      filter: { _id: user._id },
      update: {
        $addToSet: { wishList: product._id },
      },
    });
    return product;
  }

  async removeFromWishlist(
    productId: Types.ObjectId,
    user: UserDocument,
  ): Promise<string> {
    await this.userRepository.updateOne({
      filter: { _id: user._id },
      update: {
        $pull: {
          wishList: Types.ObjectId.createFromHexString(
            productId as unknown as string,
          ),
        },
      },
    });
    return 'Done';
  }
}
