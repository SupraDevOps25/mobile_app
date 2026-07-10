import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CoordinatorsService } from './coordinators.service';
import { UpdateCoordinatorDto } from './dto/update-coordinator.dto';

@ApiBearerAuth()
@ApiTags('Coordinators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coordinators')
export class CoordinatorsController {
  constructor(private readonly coordinators: CoordinatorsService) {}

  @ApiOperation({ summary: 'Coordinator: my personal + professional details' })
  @Roles('CARE_COORDINATOR')
  @Get('me')
  me(@Request() req: { user: { id: string } }) {
    return this.coordinators.me(req.user.id);
  }

  @ApiOperation({ summary: 'Coordinator: update my details' })
  @Roles('CARE_COORDINATOR')
  @Patch('me')
  updateMe(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateCoordinatorDto,
  ) {
    return this.coordinators.updateMe(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Coordinator: my earnings (8% fee per paid month)' })
  @Roles('CARE_COORDINATOR')
  @Get('me/earnings')
  earnings(@Request() req: { user: { id: string } }) {
    return this.coordinators.earnings(req.user.id);
  }

  @ApiOperation({
    summary: 'Coordinator: request payout for available months',
  })
  @Roles('CARE_COORDINATOR')
  @Post('me/payouts')
  requestPayout(@Request() req: { user: { id: string } }) {
    return this.coordinators.requestPayout(req.user.id);
  }
}
