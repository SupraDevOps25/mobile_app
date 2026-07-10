import { Module } from '@nestjs/common';
import { CoordinatorsController } from './coordinators.controller';
import { CoordinatorsService } from './coordinators.service';

@Module({
  controllers: [CoordinatorsController],
  providers: [CoordinatorsService],
})
export class CoordinatorsModule {}
