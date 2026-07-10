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
import { RegisterDeviceDto } from './dto/register-device.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth()
@ApiTags('Notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'My notifications (most recent first)' })
  @Get()
  list(@Request() req: { user: { id: string } }) {
    return this.notificationsService.listForUser(req.user.id);
  }

  @ApiOperation({ summary: 'My unread notification count' })
  @Get('unread-count')
  unreadCount(@Request() req: { user: { id: string } }) {
    return this.notificationsService.unreadCount(req.user.id);
  }

  @ApiOperation({ summary: 'Mark one notification as read' })
  @Patch(':id/read')
  markRead(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.notificationsService.markRead(req.user.id, id);
  }

  @ApiOperation({ summary: 'Mark all my notifications as read' })
  @Post('read-all')
  markAllRead(@Request() req: { user: { id: string } }) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @ApiOperation({ summary: 'Register this device for push notifications' })
  @Post('register-device')
  registerDevice(
    @Request() req: { user: { id: string } },
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(req.user.id, dto.token);
  }

  @ApiOperation({ summary: 'Release this device token on sign-out' })
  @Post('unregister-device')
  unregisterDevice(
    @Request() req: { user: { id: string } },
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.notificationsService.unregisterDevice(req.user.id, dto.token);
  }

  @ApiOperation({ summary: 'My notification channel preferences' })
  @Get('preferences')
  getPreferences(@Request() req: { user: { id: string } }) {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @ApiOperation({ summary: 'Update my notification channel preferences' })
  @Patch('preferences')
  updatePreferences(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.notificationsService.updatePreferences(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Admin sends a manual notification to any user' })
  @Roles('ADMIN')
  @Post('send')
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendManual({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
    });
  }
}
