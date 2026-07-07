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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateVisitDto } from './dto/create-visit.dto';
import { CreateVisitLogDto } from './dto/create-visit-log.dto';
import { RequestChangesDto } from './dto/request-changes.dto';
import { VisitsService } from './visits.service';

@ApiBearerAuth()
@ApiTags('Visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @ApiOperation({ summary: 'Coordinator: schedule a visit for a case' })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post()
  schedule(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateVisitDto,
  ) {
    return this.visitsService.scheduleVisit(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Nurse: my upcoming visits' })
  @Roles('CAREGIVER')
  @Get('upcoming')
  upcoming(@Request() req: { user: { id: string } }) {
    return this.visitsService.upcomingForNurse(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: my past visits (completed / missed)' })
  @Roles('CAREGIVER')
  @Get('history')
  history(@Request() req: { user: { id: string } }) {
    return this.visitsService.historyForNurse(req.user.id);
  }

  @ApiOperation({
    summary: 'Nurse: my assignments grouped, each with its visits',
  })
  @Roles('CAREGIVER')
  @Get('assignments')
  assignments(@Request() req: { user: { id: string } }) {
    return this.visitsService.assignmentsForNurse(req.user.id);
  }

  @ApiOperation({ summary: 'Family: visits on my care plan' })
  @Roles('FAMILY')
  @Get('care-plan')
  carePlan(@Request() req: { user: { id: string } }) {
    return this.visitsService.carePlanVisits(req.user.id);
  }

  @ApiOperation({
    summary: 'Coordinator: all logs (pending first, then reviewed)',
  })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Get('logs')
  allLogs(@Request() req: { user: { id: string } }) {
    return this.visitsService.allLogs(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: get one visit (with its log)' })
  @Roles('CAREGIVER')
  @Get(':id')
  getOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.visitsService.getVisit(req.user.id, id);
  }

  @ApiOperation({ summary: 'Nurse: start a visit' })
  @Roles('CAREGIVER')
  @Post(':id/start')
  start(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.visitsService.startVisit(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Nurse: submit the daily log (completes the visit)',
  })
  @Roles('CAREGIVER')
  @Post(':id/log')
  log(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CreateVisitLogDto,
  ) {
    return this.visitsService.submitLog(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Nurse: edit an unreviewed log (revise & resubmit)',
  })
  @Roles('CAREGIVER')
  @Patch(':id/log')
  editLog(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: CreateVisitLogDto,
  ) {
    return this.visitsService.updateLog(req.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Coordinator: mark a visit log reviewed' })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post(':id/review')
  review(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.visitsService.reviewLog(req.user.id, id);
  }

  @ApiOperation({ summary: 'Coordinator: request changes to a visit log' })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Post(':id/request-changes')
  requestChanges(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
  ) {
    return this.visitsService.requestChanges(req.user.id, id, dto.note);
  }
}
