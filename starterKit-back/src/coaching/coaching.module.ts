import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachingController } from './coaching.controller';
import { CoachingService } from './coaching.service';
import { Coach } from './entities/coach.entity';
import { Session } from './entities/session.entity';
import { Review } from './entities/review.entity';
import { Availability } from './entities/availability.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coach,
      Session,
      Review,
      Availability
    ]),
    CommonModule
  ],
  controllers: [CoachingController],
  providers: [CoachingService],
  exports: [CoachingService]
})
export class CoachingModule {}