import { VercelBlobStorage } from './storage-vercel-blob';

interface StorageConfig {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
}

/**
 * Storage factory function
 * Returns appropriate storage implementation based on STORAGE_PROVIDER env var
 * @param config - Optional S3 configuration (only used for S3 storage)
 * @returns Storage instance (either S3Storage or VercelBlobStorage)
 */
export function newStorage(config?: StorageConfig): Storage | VercelBlobStorage {
  const provider = process.env.STORAGE_PROVIDER || 's3';

  if (provider === 'vercel-blob') {
    console.log('📦 Using Vercel Blob storage');
    return new VercelBlobStorage();
  } else {
    console.log('📦 Using S3 storage');
    return new Storage(config);
  }
}

export class Storage {
  private endpoint: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private bucket: string;
  private region: string;

  constructor(config?: StorageConfig) {
    this.endpoint = config?.endpoint || process.env.STORAGE_ENDPOINT || "";
    this.accessKeyId =
      config?.accessKey || process.env.STORAGE_ACCESS_KEY || "";
    this.secretAccessKey =
      config?.secretKey || process.env.STORAGE_SECRET_KEY || "";
    this.bucket = process.env.STORAGE_BUCKET || "";
    this.region = config?.region || process.env.STORAGE_REGION || "auto";
  }

  async uploadFile({
    body,
    key,
    contentType,
    bucket,
    onProgress,
    disposition = "inline",
  }: {
    body: Buffer | Uint8Array;
    key: string;
    contentType?: string;
    bucket?: string;
    onProgress?: (progress: number) => void;
    disposition?: "inline" | "attachment";
  }) {
    const uploadBucket = bucket || this.bucket;
    if (!uploadBucket) {
      throw new Error("Bucket is required");
    }

    const bodyArray = body instanceof Buffer ? new Uint8Array(body) : body;

    const url = `${this.endpoint}/${uploadBucket}/${key}`;

    const { AwsClient } = await import("aws4fetch");

    const client = new AwsClient({
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    });

    const headers: Record<string, string> = {
      "Content-Type": contentType || "application/octet-stream",
      "Content-Disposition": disposition,
      "Content-Length": bodyArray.length.toString(),
    };

    const request = new Request(url, {
      method: "PUT",
      headers,
      body: bodyArray as any,
    });

    const response = await client.fetch(request);

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return {
      location: url,
      bucket: uploadBucket,
      key,
      filename: key.split("/").pop(),
      url: process.env.STORAGE_DOMAIN
        ? `${process.env.STORAGE_DOMAIN}/${key}`
        : url,
    };
  }

  async downloadAndUpload({
    url,
    key,
    bucket,
    contentType,
    disposition = "inline",
  }: {
    url: string;
    key: string;
    bucket?: string;
    contentType?: string;
    disposition?: "inline" | "attachment";
  }) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No body in response");
    }

    const arrayBuffer = await response.arrayBuffer();
    const body = new Uint8Array(arrayBuffer);

    return this.uploadFile({
      body,
      key,
      bucket,
      contentType,
      disposition,
    });
  }

  /**
   * Generate a thumbnail from an image buffer
   * @param imageBuffer - The original image buffer
   * @param maxDimension - Maximum width or height for the thumbnail (default: 512)
   * @param quality - JPEG/WebP quality (1-100, default: 80)
   * @returns Thumbnail buffer in WebP format
   */
  async generateThumbnail(
    imageBuffer: Buffer,
    maxDimension: number = 512,
    quality: number = 80
  ): Promise<Buffer> {
    const sharp = (await import("sharp")).default;

    return sharp(imageBuffer)
      .resize(maxDimension, maxDimension, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();
  }

  /**
   * Upload an image and its thumbnail for generation results
   * @param imageUrl - URL of the generated image from Kling API
   * @param generationUuid - UUID of the generation record
   * @returns Object containing URLs of the original image and thumbnail
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

    // Get image metadata
    const sharp = (await import("sharp")).default;
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
      contentType: "image/jpeg",
      disposition: "inline",
    });

    // Generate and upload thumbnail
    const thumbnailBuffer = await this.generateThumbnail(imageBuffer);
    const thumbnailUploadResult = await this.uploadFile({
      body: thumbnailBuffer,
      key: thumbnailKey,
      contentType: "image/webp",
      disposition: "inline",
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
   * Upload an image and its thumbnail for generation results from a buffer
   * @param imageBuffer - The image buffer
   * @param generationUuid - UUID of the generation record
   * @returns Object containing URLs of the original image and thumbnail
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
    const sharp = (await import("sharp")).default;
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
      contentType: "image/jpeg",
      disposition: "inline",
    });

    // Generate and upload thumbnail
    const thumbnailBuffer = await this.generateThumbnail(imageBuffer);
    const thumbnailUploadResult = await this.uploadFile({
      body: thumbnailBuffer,
      key: thumbnailKey,
      contentType: "image/webp",
      disposition: "inline",
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
   * Not implemented yet - requires DELETE support in storage client
   */
  async deleteGenerationImages(generationUuid: string): Promise<void> {
    // TODO: Implement when needed
    // This would require implementing DELETE requests with aws4fetch
    console.warn(`Delete not implemented for generation: ${generationUuid}`);
  }
}
