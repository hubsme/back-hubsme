import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { SubscriptionFindByUserResultDto } from './dto/find-by-user.dto';
import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { PlanResultDto } from '@modules/admin/modules/subscription/dto/plans.dto';
import { SubscriptionResultDto } from '@modules/admin/modules/subscription/dto/find-one.dto';
import { SubscriptionListDto, SubscriptionListFiltersDto } from '@modules/admin/modules/subscription/dto/find-all.dto';
import { SubscriptionUpsertDto } from '@modules/admin/modules/subscription/dto/upsert.dto';
import { SubscriptionCheckoutDto } from '@modules/admin/modules/subscription/dto/create-checkout.dto';
import { SubscriptionCheckoutResultDto } from '@modules/admin/modules/subscription/dto/create-checkout.dto';
import { SubscriptionService } from '@modules/admin/modules/subscription/subscription.service';

@ApiTags('subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans' })
  @ApiResponse({ status: 200, type: [PlanResultDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'plans', type: 'controller' })
  plans() {
    return this.subscriptionService.getPlans();
  }

  @Get('find-all')
  @ApiOperation({ summary: 'Get all subscriptions paginated' })
  @ApiResponse({ status: 200, type: SubscriptionListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: SubscriptionListFiltersDto) {
    return this.subscriptionService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: SubscriptionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionService.findOne(id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a subscription by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: SubscriptionFindByUserResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findByUser', type: 'controller' })
  findByUser(@Request() req: AuthenticatedRequest, @Param('userId', ParseIntPipe) userId: number) {
    return this.subscriptionService.findByUserForUser(req.user, userId);
  }

  @Post('upsert')
  @ApiOperation({ summary: 'Create or update a user subscription' })
  @ApiResponse({ status: 200, type: SubscriptionResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'upsert', type: 'controller' })
  upsert(@Request() req: AuthenticatedRequest, @Body() upsertDto: SubscriptionUpsertDto) {
    return this.subscriptionService.upsertForUser(req.user, upsertDto);
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create Mercado Pago preference for subscription plan' })
  @ApiResponse({ status: 200, type: SubscriptionCheckoutResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'createCheckout', type: 'controller' })
  createCheckout(@Request() req: AuthenticatedRequest, @Body() body: SubscriptionCheckoutDto) {
    return this.subscriptionService.createCheckoutForUser(req.user, body.planId);
  }
}
