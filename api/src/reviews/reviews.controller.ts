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
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiBearerAuth()
@ApiTags('Reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({
    summary: 'Family: the nurse (if any) I must rate before continuing',
  })
  @Roles('FAMILY')
  @Get('pending')
  pending(@Request() req: { user: { id: string } }) {
    return this.reviewsService.pendingForFamily(req.user.id);
  }

  @ApiOperation({
    summary:
      'Family: review state of one of my subscriptions (active or past) — ' +
      'whether visits are done and which nurses I still need to rate',
  })
  @Roles('FAMILY')
  @Get(':subscriptionId/status')
  status(
    @Request() req: { user: { id: string } },
    @Param('subscriptionId') subscriptionId: string,
  ) {
    return this.reviewsService.statusForFamily(req.user.id, subscriptionId);
  }

  @ApiOperation({
    summary: 'Family: submit a star rating + review for my nurse',
  })
  @Roles('FAMILY')
  @Post()
  submit(
    @Request() req: { user: { id: string } },
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.submit(req.user.id, dto);
  }
}
