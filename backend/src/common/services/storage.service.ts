import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { getEnv } from '../../config/env';
import { appLogger } from '../../config/logger';

export interface StorageProvider {
  save(filename: string, buffer: Buffer): Promise<string>;
  delete(filename: string): Promise<void>;
  getUrl(filename: string): string;
}

class LocalStorageProvider implements StorageProvider {
  private uploadPath: string;

  constructor() {
    this.uploadPath = path.resolve(getEnv().UPLOAD_PATH);
  }

  async save(filename: string, buffer: Buffer): Promise<string> {
    const dir = this.getDir(filename);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, path.basename(filename));
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${this.getType(filename)}/${path.basename(filename)}`;
  }

  async delete(filename: string): Promise<void> {
    const dir = this.getDir(filename);
    const filePath = path.join(dir, path.basename(filename));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  getUrl(filename: string): string {
    return `/uploads/${this.getType(filename)}/${path.basename(filename)}`;
  }

  private getType(filename: string): string {
    if (filename.includes('-thumb')) return 'thumbnails';
    if (filename.includes('-preview')) return 'previews';
    return 'originals';
  }

  private getDir(filename: string): string {
    return path.join(this.uploadPath, this.getType(filename));
  }
}

class VercelBlobProvider implements StorageProvider {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.VERCEL_BLOB_URL || '';
  }

  async save(filename: string, buffer: Buffer): Promise<string> {
    const { put } = await import('@vercel/blob');
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: false,
    });
    return blob.url;
  }

  async delete(filename: string): Promise<void> {
    try {
      const { del } = await import('@vercel/blob');
      await del(filename);
    } catch {
      appLogger.warn({ filename }, 'Failed to delete blob');
    }
  }

  getUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`;
  }
}

export function createStorageProvider(): StorageProvider {
  if (process.env.VERCEL === '1' || process.env.STORAGE_PROVIDER === 'vercel-blob') {
    return new VercelBlobProvider();
  }
  return new LocalStorageProvider();
}

export async function processImage(
  buffer: Buffer,
  filename: string,
): Promise<{ original: Buffer; preview: Buffer; thumbnail: Buffer }> {
  const original = buffer;

  const preview = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const thumbnail = await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 60 })
    .toBuffer();

  return { original, preview, thumbnail };
}
