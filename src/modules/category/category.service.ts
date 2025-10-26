import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetAllDto, UpdateCategoryDto } from './dto/update-category.dto';
import {
  BrandRepository,
  CategoryDocument,
  CategoryRepository,
  UserDocument,
} from 'src/DB';
import { S3Service } from 'src/common/services';
import { Types } from 'mongoose';
import { lean } from 'src/DB/repository/database.repository';
import { FolderEnum } from 'src/common';
import { randomUUID } from 'crypto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createCategoryDto: CreateCategoryDto,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<CategoryDocument> {
    const { name } = createCategoryDto;
    const checkDuplicated = await this.categoryRepository.findOne({
      filter: { name, paranoId: false },
    });

    if (checkDuplicated) {
      throw new ConflictException(
        checkDuplicated.freezedAt
          ? 'duplicated with archived Category'
          : 'Duplicated Category name',
      );
    }

    const brands: Types.ObjectId[] = [
      ...new Set(createCategoryDto.brands || []),
    ];

    if (
      brands &&
      (await this.brandRepository.find({ filter: { _id: { $in: brands } } }))
        .length != brands.length
    ) {
      throw new NotFoundException('some of mentioned brands are not exist');
    }

    let assetFolderId: string = randomUUID();
    const image: string = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.Category}/${assetFolderId}`,
    });

    const [Category] = await this.categoryRepository.create({
      data: [
        {
          ...createCategoryDto,
          assetFolderId,
          image,
          createdBy: user._id,
          brands: brands.map((brand) => {
            return Types.ObjectId.createFromHexString(
              brand as unknown as string,
            );
          }),
        },
      ],
    });

    if (!Category) {
      await this.s3Service.deleteFile({ Key: image });
      throw new BadRequestException('Fail to create this Category resource');
    }
    return Category;
  }

  async update(
    CategoryId: Types.ObjectId,
    updateCategoryDto: UpdateCategoryDto,
    user: UserDocument,
  ): Promise<CategoryDocument | lean<CategoryDocument>> {
    if (
      updateCategoryDto.name &&
      (await this.categoryRepository.findOne({
        filter: { name: updateCategoryDto.name },
      }))
    ) {
      throw new ConflictException('duplicated Category name');
    }

    const brands: Types.ObjectId[] = [
      ...new Set(updateCategoryDto.brands || []),
    ];

    if (
      brands &&
      (await this.brandRepository.find({ filter: { _id: { $in: brands } } }))
        .length != brands.length
    ) {
      throw new NotFoundException('some of mentioned brands are not exist');
    }

    // const removeBrands = updateCategoryDto.brands ?? [];
    // delete updateCategoryDto.removeBrands;

    const Category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: CategoryId },
      update: [
        {
          $set: {
            ...updateCategoryDto,
            updatedBy: user._id,
            brands: {
              $setUnion: [
                {
                  $setDifference: [
                    '$brands',
                    (updateCategoryDto.removeBrands || []).map((brand) => {
                      return Types.ObjectId.createFromHexString(
                        brand as unknown as string,
                      );
                    }),
                  ],
                },
                brands.map((brand) => {
                  return Types.ObjectId.createFromHexString(
                    brand as unknown as string,
                  );
                }),
              ],
            },
          },
        },
      ],
    });

    if (!Category) {
      throw new NotFoundException('fail to find matching Category instance');
    }

    return Category;
  }

  async updateAttachment(
    CategoryId: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<CategoryDocument | lean<CategoryDocument>> {
    const Category = await this.categoryRepository.findOne({
      filter: { _id: CategoryId },
    });

    if (!Category) {
      throw new NotFoundException('fail to find matching Category instance');
    }

    const image = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.Category}/${Category.assetFolderId}`,
    });

    const updatedCategory = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: CategoryId },
      update: {
        image,
        updatedBy: user._id,
      },
    });

    if (!updatedCategory) {
      await this.s3Service.deleteFile({ Key: image });
      throw new NotFoundException('fail to find matching Category instance');
    }
    await this.s3Service.deleteFile({ Key: Category.image });
    return updatedCategory;
  }

  async freeze(
    CategoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<string> {
    const Category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: CategoryId },
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
    CategoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<CategoryDocument | lean<CategoryDocument>> {
    const Category = await this.categoryRepository.findOneAndUpdate({
      filter: {
        _id: CategoryId,
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

    if (!Category) {
      throw new NotFoundException('fail to find matching Category instance');
    }

    return Category;
  }

  async remove(
    CategoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<string> {
    const Category = await this.categoryRepository.findOneAndDelete({
      filter: {
        _id: CategoryId,
        paranoId: false,
        freezedAt: { $exists: true },
      },
    });

    if (!Category) {
      throw new NotFoundException('fail to find matching Category instance');
    }
    await this.s3Service.deleteFile({ Key: Category.image });
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
    result: CategoryDocument[] | lean<CategoryDocument>[];
  }> {
    const { page, size, search } = data;
    const result = await this.categoryRepository.paginate({
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
    CategoryId: Types.ObjectId,
    archive: boolean = false,
  ): Promise<CategoryDocument | lean<CategoryDocument>> {
    const Category = await this.categoryRepository.findOne({
      filter: {
        _id: CategoryId,
        ...(archive ? { paranoId: false, freezedAt: { $exists: true } } : {}),
      },
    });
    if (!Category) {
      throw new NotFoundException('Fail to finds matching Category instance');
    }
    return Category;
  }
}
