import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachingController } from './controllers/coaching.controller';
import { SessionHistoryController } from './controllers/session-history.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { CoachingService } from './service/coaching.service';
import { SessionHistoryService } from './service/session-history.service';
import { Coach } from './entities/coach.entity';
import { Session } from './entities/session.entity';
import { Review } from './entities/review.entity';
import { Availability } from './entities/availability.entity';
import { SessionHistory } from './entities/session-history.entity';
import { Feedback } from './entities/feedback.entity';
import { SessionDocument } from './entities/session-document.entity';
import { ProgressTracking } from './entities/progress-tracking.entity';
import { CommonModule } from '../common/common.module';
import { CoachController } from './controllers/coach.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coach,
      Session,
      Review,
      Availability,
      SessionHistory,
      Feedback,
      SessionDocument,
      ProgressTracking,
      CoachController
    ]),
    CommonModule
  ],
  controllers: [CoachingController, SessionHistoryController, FeedbackController],
  providers: [CoachingService, SessionHistoryService],
  exports: [CoachingService, SessionHistoryService]
})
export class CoachingModule {}