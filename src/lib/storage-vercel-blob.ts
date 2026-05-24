import { put } from '@vercel/blob';

/**
 * Vercel Blob Storage Implementation
 * Uses Vercel Blob for file storage with automatic CDN distribution
 */
export class VercelBlobStorage {
  private token: string;

  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN || '';
    if (!this.token) {
      throw new Error('BLOB_READ_WRITE_TOKEN is required for Vercel Blob storage');
    }
  }

  async uploadFile({
    body,
    key,
    contentType,
    disposition = 'inline',
  }: {
    body: Buffer | Uint8Array;
    key: string;
    contentType?: string;
    bucket?: string;
    onProgress?: (progress: number) => void;
    disposition?: 'inline' | 'attachment';
  }) {
    // Ensure body is a Buffer for Vercel Blob (it doesn't accept plain Uint8Array)
    const bodyBuffer = body instanceof Buffer ? body : Buffer.from(body);

    // Upload to Vercel Blob
    const blob = await put(key, bodyBuffer, {
      access: 'public',
      token: this.token,
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: false, // We control the key ourselves
    });

    return {
      location: blob.url,
      bucket: 'vercel-blob',
      key: key,
      filename: key.split('/').pop() || key,
      url: blob.url,
    };
  }

  async downloadAndUpload({
    url,
    key,
    contentType,
    disposition = 'inline',
  }: {
    url: string;
    key: string;
    bucket?: string;
    contentType?: string;
    disposition?: 'inline' | 'attachment';
  }) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No body in response');
    }

    const arrayBuffer = await response.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    return this.uploadFile({
      body,
      key,
      contentType,
      disposition,
    });
  }

  /**
   * Generate a thumbnail from an image buffer
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    maxDimension: number = 512,
    quality: number = 80
  ): Promise<Buffer> {
    const sharp = (await import('sharp')).default;

    return sharp(imageBuffer)
      .resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
  }

  /**
   * Upload an image and its thumbnail for generation results
   */
  async uploadGenerationImage(
    imageUrl: string,
    generationUuid: string
  ): Promise<{
    imageUrl: string;
    thumbnailUrl: string;
    fileSize: number;
    width: number;
    height: number;
  }> {
    // Download the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    return this.uploadGenerationImageFromBuffer(imageBuffer, generationUuid);
  }

  /**
   * Upload an image and its thumbnail for generation results from a buffer
   */
  async uploadGenerationImageFromBuffer(
    imageBuffer: Buffer,
    generationUuid: string
  ): Promise<{
    imageUrl: string;
    thumbnailUrl: string;
    fileSize: number;
    width: number;
    height: number;
  }> {
    // Get image metadata
    const sharp = (await import('sharp')).default;
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Generate paths
    const timestamp = Date.now();
    const imageKey = `generations/${generationUuid}/image-${timestamp}.jpg`;
    const thumbnailKey = `generations/${generationUuid}/thumb-${timestamp}.webp`;

    // Upload original image
    const imageUploadResult = await this.uploadFile({
      body: imageBuffer,
      key: imageKey,
      contentType: 'image/jpeg',
      disposition: 'inline',
    });

    // Generate and upload thumbnail
    const thumbnailBuffer = await this.generateThumbnail(imageBuffer);
    const thumbnailUploadResult = await this.uploadFile({
      body: thumbnailBuffer,
      key: thumbnailKey,
      contentType: 'image/webp',
      disposition: 'inline',
    });

    return {
      imageUrl: imageUploadResult.url,
      thumbnailUrl: thumbnailUploadResult.url,
      fileSize: imageBuffer.length,
      width,
      height,
    };
  }

  /**
   * Delete generation images (original + thumbnail)
   */
  async deleteGenerationImages(generationUuid: string): Promise<void> {
    // Vercel Blob delete is done via del() function
    // For now, we'll just log a warning
    console.warn(`Delete not implemented for generation: ${generationUuid}`);
    // TODO: Implement using @vercel/blob del() function if needed
  }
}
