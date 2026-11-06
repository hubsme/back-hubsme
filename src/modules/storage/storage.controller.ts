import { HttpErrorDto } from '@dto/http-error.dto';
import { TraceNode } from '@erixcel/traceflow';
import { StorageDeleteParamsDto } from './dto/delete.dto';
import { StorageDownloadQueryDto } from './dto/download.dto';
import { Controller, Delete, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { StorageResultDto, StorageUploadBodyDto } from '@modules/storage/dto/upload.dto';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @ApiOperation({ summary: 'Subir un archivo a Azure Storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: StorageUploadBodyDto })
  @ApiResponse({ status: 200, type: StorageResultDto })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'upload', type: 'controller' })
  upload(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    return this.storageService.upload(file, folder);
  }

  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un archivo de Azure Storage' })
  @ApiResponse({ status: 200, description: 'Operación completada' })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'delete', type: 'controller' })
  delete(@Param() params: StorageDeleteParamsDto) {
    return this.storageService.delete(params.publicId);
  }

  @Get('download-file')
  @ApiOperation({ summary: 'Visualizar o descargar archivo de Azure Storage' })
  @ApiResponse({ status: 200, description: 'Operación completada' })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'download', type: 'controller' })
  download(@Query() query: StorageDownloadQueryDto) {
    return this.storageService.download(query.path);
  }
}
