import {
  Body,
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
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@ApiBearerAuth()
@ApiTags('Messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Coordinator: my conversations (one per case)' })
  @Roles('CARE_COORDINATOR', 'ADMIN')
  @Get('conversations')
  conversations(@Request() req: { user: { id: string } }) {
    return this.messagesService.conversations(req.user.id);
  }

  @ApiOperation({ summary: 'Family: my conversation with my Care Coordinator' })
  @Roles('FAMILY')
  @Get('family')
  familyThread(@Request() req: { user: { id: string } }) {
    return this.messagesService.familyThread(req.user.id);
  }

  @ApiOperation({ summary: 'Open a conversation thread for a case' })
  @Roles('FAMILY', 'CARE_COORDINATOR', 'ADMIN')
  @Get('thread/:subscriptionId')
  thread(
    @Request() req: { user: { id: string } },
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.messagesService.thread(req.user.id, subscriptionId);
  }

  @ApiOperation({ summary: 'Send a message in a conversation' })
  @Roles('FAMILY', 'CARE_COORDINATOR', 'ADMIN')
  @Post('thread/:subscriptionId')
  send(
    @Request() req: { user: { id: string } },
    @Param('subscriptionId') subscriptionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(req.user.id, subscriptionId, dto.body);
  }
}
