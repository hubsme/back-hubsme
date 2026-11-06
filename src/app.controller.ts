import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TraceNode } from '@erixcel/traceflow';
import { HttpErrorDto } from '@dto/http-error.dto';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Check API availability' })
  @ApiResponse({ status: 200, type: String })
  @ApiResponse({ status: 500, type: HttpErrorDto })
  @TraceNode({ name: 'Check API availability', type: 'controller' })
  getHello(): string {
    return this.appService.getHello();
  }
}
