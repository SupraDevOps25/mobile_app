import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('FAMILY')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({
    summary: 'Subscribe to a care package (also creates the care recipient)',
  })
  @Post()
  subscribe(
    @Request() req: { user: { id: string } },
    @Body() dto: SubscribeDto,
  ) {
    return this.subscriptionsService.subscribe(req.user.id, dto);
  }

  @ApiOperation({ summary: "Get the family's current subscription" })
  @Get('active')
  getActive(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.getActive(req.user.id);
  }
}
