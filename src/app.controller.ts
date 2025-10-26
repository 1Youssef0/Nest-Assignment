import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { S3Service } from './common/services';
import type { Response } from 'express';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';

const createS3WriteStreamPipe = promisify(pipeline);

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly s3Service: S3Service,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('hi')
  sayHi(): string {
    return this.appService.getHello();
  }

  //  app.get(
  //   "/upload/*path",
  //   async (req: Request, res: Response): Promise<void> => {
  //     const { downloadName, download = "false" } = req.query as {
  //       downloadName?: string;
  //       download?: string;
  //     };
  //     const { path } = req.params as unknown as { path: string[] };
  //     const Key = path.join("/");
  //     const s3Response = await getFile({ Key });
  //     if (!s3Response.Body) {
  //       throw new BadRequestException("failed to fetch this asset");
  //     }

  //     res.setHeader(
  //       "content-type",
  //       `${s3Response.ContentType || "application/octet-stream"}`
  //     );

  //     if (download === "true") {
  //       res.setHeader(
  //         "Content-Disposition",
  //         `attachment; filename="${downloadName || Key.split("/").pop()}"`
  //       );
  //     }

  //     return await createS3WriteStreamPipe(
  //       s3Response.Body as NodeJS.ReadableStream,
  //       res
  //     );
  //   }
  // );

  @Get('/upload/pre-signed/*path')
  async getPresignedAssetUrl(
    @Query() query: { download?: 'true' | 'false'; filename?: string },
    @Param() Params: { path: string[] },
  ) {
    const { download, filename } = query;
    const { path } = Params;
    const Key = path.join('/');
    const url = await this.s3Service.createGetPreSignedLink({
      Key,
      download,
    });
    return { message: 'done', data: { url } };
  }

  @Get('/upload/*path')
  async getAsset(
    @Query() query: { download?: 'true' | 'false'; filename?: string },
    @Param() Params: { path: string[] },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { download, filename } = query;
    const { path } = Params;
    const Key = path.join('/');

    const s3Response = await this.s3Service.getFile({ Key });
    if (!s3Response.Body) {
      throw new BadRequestException('failed to fetch this asset');
    }

    res.setHeader(
      'content-type',
      `${s3Response.ContentType || 'application/octet-stream'}`,
    );

    if (download === 'true') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename || Key.split('/').pop()}"`,
      );
    }

    return await createS3WriteStreamPipe(
      s3Response.Body as NodeJS.ReadableStream,
      res,
    );
  }
}
