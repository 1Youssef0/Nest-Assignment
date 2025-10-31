import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { StorageEnum } from '../enums';
import { createReadStream } from 'node:fs';
import { Upload } from '@aws-sdk/lib-storage';

export class S3Service {
  private s3client: S3Client;
  constructor() {
    this.s3client = new S3Client({
      region: process.env.AWS_REGION as string,
      credentials: {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      },
    });
  }

  uploadFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = 'private',
    path = 'general',
    file,
    storageApproach = StorageEnum.memory,
  }: {
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
    storageApproach?: StorageEnum;
  }): Promise<string> => {
    const command = new PutObjectCommand({
      Bucket,
      ACL,
      Key: `${process.env.APPLICATION_NAME}/${path}/${randomUUID()}_${
        file.originalname
      }`,
      Body:
        storageApproach === StorageEnum.memory
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype,
    });

    await await this.s3client.send(command);
    if (!command?.input?.Key) {
      throw new BadRequestException('fail to generate upload key');
    }
    return command.input.Key;
  };

  uploadFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = 'private',
    path = 'general',
    files,
    storageApproach = StorageEnum.memory,
  }: {
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[];
    storageApproach?: StorageEnum;
  }): Promise<string[]> => {
    let urls: string[] = [];

    //UPLOADS ALL FILES AT ONCE

    urls = await Promise.all(
      files.map((file) => {
        return this.uploadFile({
          Bucket,
          ACL,
          path,
          file,
          storageApproach,
        });
      }),
    );

    // UPLOAD FILES ONE BY ONE

    // for (const file of files) {
    //     const key = await uploadFile({
    //         Bucket,
    //         ACL,
    //         path,
    //         file,
    //         storageApproach
    //     })
    //     urls.push(key)
    // }
    return urls;
  };

  uploadLargeFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    ACL = 'private',
    path = 'general',
    file,
    storageApproach = StorageEnum.disk,
  }: {
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File;
    storageApproach?: StorageEnum;
  }): Promise<string> => {
    const upload = new Upload({
      client:  this.s3client,
      params: {
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${randomUUID()}_${
          file.originalname
        }`,
        Body:
          storageApproach === StorageEnum.memory
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype,
      },
      // partSize:
    });

    upload.on('httpUploadProgress', (progress) => {
      console.log(`Upload file progress is :::`, progress);
    });
    const { Key } = await upload.done();
    if (!Key) {
      throw new BadRequestException('fail to generate upload key');
    }
    return Key;
  };

  uploadLargeFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    ACL = 'private',
    path = 'general',
    files,
    storageApproach = StorageEnum.disk,
  }: {
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[];
    storageApproach?: StorageEnum;
  }): Promise<string[]> => {
    let urls: string[] = [];

    //UPLOADS ALL FILES AT ONCE

    urls = await Promise.all(
      files.map((file) => {
        return this.uploadLargeFile({
          Bucket,
          ACL,
          path,
          file,
          storageApproach,
        });
      }),
    );

    return urls;
  };

  createPreSignedUpLoadLink = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path = 'general',
    ContentType,
    expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
    originalname,
  }: {
    Bucket?: string;
    path?: string;
    ContentType: string;
    expiresIn?: number;
    originalname: string;
  }): Promise<{ url: string; Key: string }> => {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${process.env.APPLICATION_NAME}/${path}/${randomUUID()}_${originalname}`,
      ContentType,
    });
    const url = await getSignedUrl( this.s3client, command, { expiresIn });
    if (!url || !command.input.Key) {
      throw new BadRequestException('failed to create pre-signed url');
    }
    return { url, Key: command.input.Key };
  };

  createGetPreSignedLink = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key,
    expiresIn = Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
    downloadName = 'dummy',
    download = 'false',
  }: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    downloadName?: string;
    download?: string;
  }): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition:
        download === 'true'
          ? `attachment; filename="${downloadName || Key.split('/').pop()}"`
          : undefined,
    });
    const url = await getSignedUrl( this.s3client, command, { expiresIn });
    if (!url) {
      throw new BadRequestException('failed to create pre-signed url');
    }
    return url;
  };

  getFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<GetObjectCommandOutput> => {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });
    return  await this.s3client.send(command);
  };

   deleteFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<DeleteObjectCommandOutput> => {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });

    return await  this.s3client.send(command);
  };

  deleteFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    urls,
    Quiet = false,
  }: {
    Bucket?: string;
    urls: string[];
    Quiet?: boolean | undefined;
  }): Promise<DeleteObjectsCommandOutput> => {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: urls.map((url) => {
          return { Key: url };
        }),
        Quiet,
      },
    });
    return await this.s3client.send(command);
  };

  listDirectoryFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path,
  }: {
    Bucket?: string;
    path: string;
  }) => {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${process.env.APPLICATION_NAME}/${path}`,
    });

    return await this.s3client.send(command);
  };

  deleteFolderByPrefix = async ({
    Bucket = process.env.AWS_BUCKET_NAME as string,
    path,
    Quiet = false,
  }: {
    Bucket?: string;
    path: string;
    Quiet?: boolean;
  }): Promise<DeleteObjectsCommandOutput> => {
    const fileList = await this.listDirectoryFiles({ Bucket, path });

    if (!fileList?.Contents?.length) {
      throw new BadRequestException('empty directory');
    }

    const urls: string[] = fileList.Contents.map((file) => {
      return file.Key as string;
    });

    return await this.deleteFiles({ urls, Bucket, Quiet });
  };
}
