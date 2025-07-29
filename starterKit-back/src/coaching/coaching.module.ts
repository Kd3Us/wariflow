import { Module } from '@nestjs/common';
import { CoachingService } from './coaching.service';
import { CoachingController } from './coaching.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [CoachingController],
  providers: [CoachingService],
  exports: [CoachingService],
})
export class CoachingModule {}