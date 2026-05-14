import { Injectable, InternalServerErrorException, StreamableFile } from '@nestjs/common';
import { BlobServiceClient } from '@azure/storage-blob';
import { Readable } from 'stream';
import { StorageResultDto } from './dto/storage-result.dto';

@Injectable()
export class StorageService {
  private readonly containerName = process.env.AZURE_CONTAINER_NAME || 'storage';
  private blobServiceClient: BlobServiceClient | null = null;

  async upload(file: Express.Multer.File, folder: string = 'storage'): Promise<StorageResultDto> {
    try {
      if (!file) {
        throw new InternalServerErrorException('No se recibio ningun archivo');
      }

      const originalName = file.originalname;
      const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const extension = originalName.split('.').pop() || '';
      const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
      const filename = `${safeName}_${Date.now()}.${extension}`;
      const blobPath = folder ? `${folder}/${filename}` : filename;

      const containerClient = this.getClient().getContainerClient(this.containerName);
      await containerClient.createIfNotExists({ access: 'blob' });

      const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      return {
        publicId: blobPath,
        url: blockBlobClient.url,
        secureUrl: blockBlobClient.url,
        format: extension,
        bytes: file.size,
        resourceType: this.getResourceType(file.mimetype),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException('Error al subir archivo a Azure Storage');
    }
  }

  async delete(publicId: string) {
    try {
      const containerClient = this.getClient().getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(decodeURIComponent(publicId));
      return await blockBlobClient.deleteIfExists();
    } catch (error) {
      throw new InternalServerErrorException('Error eliminando archivo de Azure Storage');
    }
  }

  async download(publicId: string): Promise<StreamableFile> {
    try {
      const decodedPath = decodeURIComponent(publicId);
      const containerClient = this.getClient().getContainerClient(this.containerName);
      const blockBlobClient = containerClient.getBlockBlobClient(decodedPath);
      const downloadResponse = await blockBlobClient.download(0);
      const stream = downloadResponse.readableStreamBody;

      if (!(stream instanceof Readable)) {
        throw new InternalServerErrorException('No se encontro contenido para descargar');
      }

      return new StreamableFile(stream, {
        type: downloadResponse.contentType || 'application/octet-stream',
        disposition: `inline; filename="${decodedPath.split('/').pop()}"`,
      });
    } catch (error) {
      if (error instanceof InternalServerErrorException) throw error;
      throw new InternalServerErrorException('Error al descargar archivo de Azure Storage');
    }
  }

  private getClient(): BlobServiceClient {
    if (this.blobServiceClient) return this.blobServiceClient;

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new InternalServerErrorException('Azure Storage no esta configurado');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    return this.blobServiceClient;
  }

  private getResourceType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'raw';
  }
}
