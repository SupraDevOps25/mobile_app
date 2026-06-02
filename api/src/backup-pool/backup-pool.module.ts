import { Module } from '@nestjs/common';
import { BackupPoolController } from './backup-pool.controller';
import { BackupPoolService } from './backup-pool.service';

@Module({
  controllers: [BackupPoolController],
  providers: [BackupPoolService],
  exports: [BackupPoolService],
})
export class BackupPoolModule {}
