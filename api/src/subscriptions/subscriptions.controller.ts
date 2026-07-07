import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignmentsService } from '../assignments/assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ChangePackageDto } from './dto/change-package.dto';
import { RenewDto } from './dto/renew.dto';
import { SetAssessmentDto } from './dto/set-assessment.dto';
import { SetCareStartDto } from './dto/set-care-start.dto';
import { SubscribeDto } from './dto/subscribe.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiBearerAuth()
@ApiTags('Subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  @ApiOperation({
    summary: 'Family: subscribe to a care package (also creates the recipient)',
  })
  @Roles('FAMILY')
  @Post()
  subscribe(
    @Request() req: { user: { id: string } },
    @Body() dto: SubscribeDto,
  ) {
    return this.subscriptionsService.subscribe(req.user.id, dto);
  }

  @ApiOperation({ summary: "Family: get the family's current subscription" })
  @Roles('FAMILY')
  @Get('active')
  getActive(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.getActive(req.user.id);
  }

  @ApiOperation({
    summary: 'Family: past care engagements (ended subscriptions)',
  })
  @Roles('FAMILY')
  @Get('history')
  history(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.history(req.user.id);
  }

  @ApiOperation({ summary: 'Family: full detail of one past engagement' })
  @Roles('FAMILY')
  @Get('history/:id')
  historyDetail(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.historyDetail(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Family: renew the package (same team, or re-match a new nurse)',
  })
  @Roles('FAMILY')
  @Post(':id/renew')
  renew(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: RenewDto,
  ) {
    return this.subscriptionsService.renew(req.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Family: end the service (or decline renewal)' })
  @Roles('FAMILY')
  @Post(':id/cancel')
  cancel(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.subscriptionsService.cancel(req.user.id, id);
  }

  @ApiOperation({ summary: 'Coordinator: list the cases I coordinate' })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Get('coordinating')
  coordinating(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.coordinatingCases(req.user.id);
  }

  @ApiOperation({
    summary: "Coordinator: one case's package contents and visits/logs",
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Get('coordinating/:id')
  coordinatingCase(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.coordinatorCaseDetail(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Coordinator: re-run matching with a different primary nurse',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post(':id/rematch')
  rematch(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.subscriptionsService.rematch(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Coordinator: schedule the initial home visit (assessment)',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Patch(':id/assessment')
  setAssessment(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: SetAssessmentDto,
  ) {
    return this.subscriptionsService.setAssessment(req.user.id, id, dto);
  }

  @ApiOperation({
    summary:
      'Coordinator: match a second (assistant) nurse for a full-time case',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post(':id/match-assistant')
  matchAssistant(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.assignmentsService.matchAssistant(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Coordinator: cancel a pending second-nurse request',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post(':id/cancel-assistant')
  cancelAssistant(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.cancelAssistant(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Coordinator: mark the initial home visit (assessment) as done',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post(':id/complete-assessment')
  completeAssessment(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.subscriptionsService.completeAssessment(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Coordinator: re-recommend a different package (re-prices)',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Patch(':id/package')
  changePackage(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: ChangePackageDto,
  ) {
    return this.subscriptionsService.changePackage(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Coordinator: set the care-start date (agreed with the family)',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Patch(':id/care-start')
  setCareStart(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: SetCareStartDto,
  ) {
    return this.subscriptionsService.setCareStart(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Coordinator: activate care (generates the visit schedule)',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post(':id/activate')
  activate(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.subscriptionsService.activate(req.user.id, id);
  }
}
