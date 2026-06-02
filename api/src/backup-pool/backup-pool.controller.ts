import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BackupPoolService } from './backup-pool.service';

@ApiBearerAuth()
@ApiTags('Backup Pool')
@UseGuards(JwtAuthGuard)
@Controller('backup-suggestions')
export class BackupPoolController {
  constructor(private readonly backupPoolService: BackupPoolService) {}

  @ApiOperation({
    summary:
      'Get ranked replacement caregiver suggestions for a cancelled shift',
  })
  @Get(':shiftId')
  getSuggestions(
    @Param('shiftId') shiftId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.backupPoolService.getSuggestions(shiftId, req.user.id);
  }
}
