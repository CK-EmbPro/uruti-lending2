import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export interface FileUploadOptions {
  destination?: string;
  filename?: string;
  maxSize?: number;
  allowedMimeTypes?: string[];
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url?: string;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private s3Client: S3Client | null = null;
  private useS3: boolean;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
    this.maxFileSize = parseInt(this.configService.get('MAX_FILE_SIZE') || '10485760', 10); // 10MB default
    this.useS3 = this.configService.get('USE_S3') === 'true';

    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // Initialize S3 client if configured
    if (this.useS3) {
      this.s3Client = new S3Client({
        region: this.configService.get('AWS_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
        },
      });
    }
  }

  /**
   * Configure multer storage
   */
  getMulterStorage(options: FileUploadOptions = {}) {
    const destination = options.destination || this.uploadDir;

    return multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(destination, this.getDateFolder());
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const filename = options.filename || `${uniqueSuffix}${ext}`;
        cb(null, filename);
      },
    });
  }

  /**
   * Get multer configuration
   */
  getMulterConfig(options: FileUploadOptions = {}) {
    const allowedMimeTypes = options.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    return {
      storage: this.getMulterStorage(options),
      limits: {
        fileSize: options.maxSize || this.maxFileSize,
      },
      fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`));
        }
      },
    };
  }

  /**
   * Upload file to local storage
   */
  async uploadFile(
    file: Express.Multer.File,
    options: FileUploadOptions = {},
  ): Promise<UploadedFile> {
    try {
      if (this.useS3 && this.s3Client) {
        return await this.uploadToS3(file, options);
      }

      return await this.uploadToLocal(file, options);
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload file to local storage
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    options: FileUploadOptions = {},
  ): Promise<UploadedFile> {
    const destination = options.destination || this.uploadDir;
    const dateFolder = this.getDateFolder();
    const uploadPath = path.join(destination, dateFolder);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = options.filename || `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadPath, filename);

    // Move file if it's in temp location
    if (file.path !== filePath) {
      fs.renameSync(file.path, filePath);
    }

    const uploadedFile: UploadedFile = {
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      url: `/uploads/${dateFolder}/${filename}`,
    };

    this.logger.debug(`File uploaded: ${filename} (${file.size} bytes)`);
    return uploadedFile;
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    file: Express.Multer.File,
    options: FileUploadOptions = {},
  ): Promise<UploadedFile> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const bucket = this.configService.get('AWS_S3_BUCKET') || '';
    const dateFolder = this.getDateFolder();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = options.filename || `${uniqueSuffix}${ext}`;
    const key = `${dateFolder}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer || fs.readFileSync(file.path),
      ContentType: file.mimetype,
      ACL: 'private',
    });

    await this.s3Client.send(command);

    const url = `https://${bucket}.s3.amazonaws.com/${key}`;

    const uploadedFile: UploadedFile = {
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: key,
      url,
    };

    this.logger.debug(`File uploaded to S3: ${key} (${file.size} bytes)`);
    return uploadedFile;
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (this.useS3 && this.s3Client) {
        // S3 deletion would go here
        this.logger.warn('S3 file deletion not implemented');
        return;
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.debug(`File deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get date-based folder structure
   */
  private getDateFolder(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}

