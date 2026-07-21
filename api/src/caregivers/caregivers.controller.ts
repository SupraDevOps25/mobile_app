import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CaregiversService,
  type UploadedFile as MulterFile,
} from './caregivers.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateCaregiverProfileDto } from './dto/update-caregiver-profile.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiBearerAuth()
@ApiTags('Caregivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CAREGIVER')
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @ApiOperation({ summary: 'Nurse: get my profile' })
  @Get('me')
  getMe(@Request() req: { user: { id: string } }) {
    return this.caregiversService.getMe(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: update my profile (bio, languages, etc.)' })
  @Patch('me/profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateCaregiverProfileDto,
  ) {
    return this.caregiversService.updateProfile(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Nurse: upload / replace my profile photo' })
  @ApiConsumes('multipart/form-data')
  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: MulterFile,
  ) {
    return this.caregiversService.uploadPhoto(req.user.id, file);
  }

  @ApiOperation({ summary: 'Nurse: my earnings (subscription-based, monthly)' })
  @Get('me/earnings')
  earnings(@Request() req: { user: { id: string } }) {
    return this.caregiversService.earnings(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: my ratings & individual reviews' })
  @Get('me/reviews')
  reviews(@Request() req: { user: { id: string } }) {
    return this.caregiversService.myReviews(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: request a payout of my available balance' })
  @Post('me/payouts')
  requestPayout(@Request() req: { user: { id: string } }) {
    return this.caregiversService.requestPayout(req.user.id);
  }

  @ApiOperation({ summary: 'Nurse: list my uploaded credentials' })
  @Get('me/documents')
  listDocuments(@Request() req: { user: { id: string } }) {
    return this.caregiversService.listDocuments(req.user.id);
  }

  @ApiOperation({
    summary: 'Nurse: upload / replace a credential (Ghana/PIN card)',
  })
  @ApiConsumes('multipart/form-data')
  @Post('me/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Request() req: { user: { id: string } },
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: MulterFile,
  ) {
    return this.caregiversService.uploadDocument(
      req.user.id,
      dto.type,
      dto.idNumber,
      file,
    );
  }

  @ApiOperation({ summary: 'Nurse: set my availability' })
  @Patch('me/availability')
  setAvailability(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.caregiversService.setAvailability(req.user.id, dto.isAvailable);
  }

  @ApiOperation({ summary: 'Nurse: set my weekly working schedule' })
  @Patch('me/schedule')
  setSchedule(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.caregiversService.setSchedule(req.user.id, dto);
  }
}
