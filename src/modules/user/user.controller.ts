import {
  Controller,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RoleEnum, StorageEnum, successResponse, User } from 'src/common';
import { Auth } from 'src/common/decorators/auth.decorator';
import type { UserDocument } from 'src/DB';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload, fileValidation } from 'src/common/utils/multer';
import type { IResponse } from './../../common/interfaces';
import { ProfileResponse } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth([RoleEnum.admin, RoleEnum.superAdmin, RoleEnum.user])
  @Get()
  async profile(
    @User() user: UserDocument,
  ): Promise<IResponse<ProfileResponse>> {
    const profile = await this.userService.profile(user);
    return successResponse<ProfileResponse>({ data: { profile } });
  }

  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      cloudFileUpload({
        // storageApproach:StorageEnum.disk,
        validation: fileValidation.image,
        fileSize: 2,
      }),
    ),
  )
  @Auth([RoleEnum.user])
  @Patch('profile-image')
  async profileImage(
    @User() user: UserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<IResponse<ProfileResponse>> {
    const profile = await this.userService.profileImage(file, user);
    return successResponse<ProfileResponse>({ data: { profile } });
  }

  // @UseInterceptors(
  //   FilesInterceptor(
  //     'coverImage',
  //     2,
  //     localFileUpload({
  //       folder: 'User',
  //       validation: fileValidation.image,
  //       fileSize: 2,
  //     }),
  //   ),
  // )
  // @Auth([RoleEnum.user])
  // @Patch('cover-image')
  // coverImage(
  //   @UploadedFiles(
  //     new ParseFilePipe({
  //       validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
  //       fileIsRequired: true,
  //     }),
  //   )
  //   files: Array<IMulterFile>,
  // ) {
  //   return { message: 'done', files };
  // }

  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'profileImage', maxCount: 1 },
  //       { name: 'coverImage', maxCount: 2 },
  //     ],
  //     localFileUpload({
  //       folder: 'User',
  //       validation: fileValidation.image,
  //       fileSize: 2,
  //     }),
  //   ),
  // )
  // @Auth([RoleEnum.user])
  // @Patch('image')
  // image(
  //   @UploadedFiles(
  //     new ParseFilePipe({
  //       // validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
  //       fileIsRequired: true,
  //     }),
  //   )
  //   files: {
  //     profileImage: Array<IMulterFile>;
  //     coverImage: Array<IMulterFile>;
  //   },
  // ) {
  //   return { message: 'done', files };
  // }
}
