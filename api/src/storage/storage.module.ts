import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

// Global so any feature module can inject CloudinaryService without re-importing.
@Global()
@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class StorageModule {}
