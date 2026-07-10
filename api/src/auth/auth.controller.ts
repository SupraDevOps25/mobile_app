import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Post,
  Query,
  Request,
  Res,
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
import type { Response } from 'express';
import { AuthService, type UploadedFile as MulterFile } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Check email and phone availability before registration',
  })
  @Post('check-availability')
  checkAvailability(@Body() dto: CheckAvailabilityDto) {
    return this.authService.checkAvailability(dto);
  }

  @ApiOperation({
    summary: 'Register a new account (sends verification email)',
  })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verify email address via token link' })
  @Get('verify-email')
  @Header('Content-Type', 'text/html')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    const html = await this.authService.verifyEmail(token ?? '');
    res.send(html);
  }

  @ApiOperation({ summary: 'Resend verification email' })
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @ApiOperation({ summary: 'Login and receive a JWT token' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the profile of the logged-in user' })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my own name and phone (any role)' })
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload / replace my own profile photo (any role)' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @Post('profile/photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: MulterFile,
  ) {
    return this.authService.uploadPhoto(req.user.id, file);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change my password' })
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
