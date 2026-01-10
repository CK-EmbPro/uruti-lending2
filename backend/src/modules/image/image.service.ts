import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'right' | 'bottom' | 'left';
}

export interface ImageFormatOptions {
  format: 'jpeg' | 'png' | 'webp' | 'gif';
  quality?: number;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  /**
   * Resize image
   */
  async resize(
    buffer: Buffer,
    options: ImageResizeOptions,
  ): Promise<Buffer> {
    try {
      let image = sharp(buffer);

      if (options.width || options.height) {
        image = image.resize(options.width, options.height, {
          fit: options.fit || 'cover',
          position: options.position || 'center',
        });
      }

      const result = await image.toBuffer();
      this.logger.debug(`Image resized: ${buffer.length} -> ${result.length} bytes`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to resize image: ${error.message}`, error.stack);
      throw new Error(`Failed to resize image: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(
    buffer: Buffer,
    size: number = 200,
  ): Promise<Buffer> {
    return this.resize(buffer, {
      width: size,
      height: size,
      fit: 'cover',
    });
  }

  /**
   * Convert image format
   */
  async convertFormat(
    buffer: Buffer,
    options: ImageFormatOptions,
  ): Promise<Buffer> {
    try {
      let image = sharp(buffer);

      switch (options.format) {
        case 'jpeg':
          image = image.jpeg({ quality: options.quality || 90 });
          break;
        case 'png':
          image = image.png({ quality: options.quality || 90 });
          break;
        case 'webp':
          image = image.webp({ quality: options.quality || 90 });
          break;
        case 'gif':
          image = image.gif();
          break;
      }

      const result = await image.toBuffer();
      this.logger.debug(`Image converted to ${options.format}: ${result.length} bytes`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to convert image: ${error.message}`, error.stack);
      throw new Error(`Failed to convert image: ${error.message}`);
    }
  }

  /**
   * Optimize image (compress)
   */
  async optimize(
    buffer: Buffer,
    quality: number = 80,
  ): Promise<Buffer> {
    try {
      const metadata = await sharp(buffer).metadata();
      let image = sharp(buffer);

      // Convert to JPEG for better compression (if not already)
      if (metadata.format !== 'jpeg') {
        image = image.jpeg({ quality });
      } else {
        image = image.jpeg({ quality });
      }

      const result = await image.toBuffer();
      this.logger.debug(`Image optimized: ${buffer.length} -> ${result.length} bytes`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to optimize image: ${error.message}`, error.stack);
      throw new Error(`Failed to optimize image: ${error.message}`);
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get image metadata: ${error.message}`, error.stack);
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }

  /**
   * Crop image
   */
  async crop(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<Buffer> {
    try {
      const result = await sharp(buffer)
        .extract({ left: x, top: y, width, height })
        .toBuffer();
      
      this.logger.debug(`Image cropped: ${width}x${height} at (${x}, ${y})`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to crop image: ${error.message}`, error.stack);
      throw new Error(`Failed to crop image: ${error.message}`);
    }
  }
}

