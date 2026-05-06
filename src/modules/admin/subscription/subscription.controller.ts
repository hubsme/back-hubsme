import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { PlanResultDto, SubscriptionResultDto } from './dto/subscription-result.dto';
import { SubscriptionListDto, SubscriptionListFiltersDto } from './dto/subscription-list.dto';
import { SubscriptionUpsertDto } from './dto/subscription-upsert.dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans' })
  @ApiResponse({ status: 200, type: [PlanResultDto] })
  plans() {
    return this.subscriptionService.getPlans();
  }

  @Get('find-all')
  @ApiOperation({ summary: 'Get all subscriptions paginated' })
  @ApiResponse({ status: 200, type: SubscriptionListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: SubscriptionListFiltersDto) {
    return this.subscriptionService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: SubscriptionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.subscriptionService.findOne(+id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a subscription by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: SubscriptionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findByUser(@Param('userId') userId: string) {
    return this.subscriptionService.findByUserId(+userId);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a user subscription' })
  @ApiResponse({ status: 200, type: SubscriptionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  upsert(@Body() upsertDto: SubscriptionUpsertDto) {
    return this.subscriptionService.upsert(upsertDto);
  }
}
