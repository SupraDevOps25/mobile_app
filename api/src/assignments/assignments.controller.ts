import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AssignmentsService } from './assignments.service';

@ApiBearerAuth()
@ApiTags('Assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @ApiOperation({ summary: 'Nurse: list my open assignment offers' })
  @Roles('CAREGIVER')
  @Get('offers')
  offers(@Request() req: { user: { id: string } }) {
    return this.assignmentsService.offersFor(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: list my accepted/active assignments' })
  @Roles('CAREGIVER')
  @Get('mine')
  mine(@Request() req: { user: { id: string } }) {
    return this.assignmentsService.mine(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: get one assignment' })
  @Roles('CAREGIVER')
  @Get(':id')
  getOne(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.assignmentsService.getOne(req.user.id, id);
  }

  @ApiOperation({ summary: 'Nurse: accept an assignment offer' })
  @Roles('CAREGIVER')
  @Post(':id/accept')
  accept(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.assignmentsService.accept(req.user.id, id);
  }

  @ApiOperation({ summary: 'Nurse: decline an assignment offer' })
  @Roles('CAREGIVER')
  @Post(':id/decline')
  decline(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.assignmentsService.decline(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Nurse: request a second nurse for a full-time case',
  })
  @Roles('CAREGIVER')
  @Post(':id/request-assistant')
  requestAssistant(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.assignmentsService.requestAssistant(req.user.id, id);
  }
}
