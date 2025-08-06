import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { CoachingController } from './controllers/coaching.controller';
import { SessionHistoryController } from './controllers/session-history.controller';
import { FeedbackController } from './controllers/feedback.controller';
import { CoachController } from './controllers/coach.controller';
import { SupportChatController } from './controllers/support-chat.controller';
import { CoachingService } from './service/coaching.service';
import { SessionHistoryService } from './service/session-history.service';
import { SmartNotificationService } from './service/smart-notification.service';
import { SupportChatService } from './service/support-chat.service';
import { SupportChatNotificationService } from './service/support-chat-notification.service';
import { Coach } from './entities/coach.entity';
import { Session } from './entities/session.entity';
import { Review } from './entities/review.entity';
import { Availability } from './entities/availability.entity';
import { SessionHistory } from './entities/session-history.entity';
import { Feedback } from './entities/feedback.entity';
import { SessionDocument } from './entities/session-document.entity';
import { ProgressTracking } from './entities/progress-tracking.entity';
import { SupportTicket, ChatMessage } from './entities/support-ticket.entity';
import { CommonModule } from '../common/common.module';

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
      SupportTicket,
      ChatMessage
    ]),
    CommonModule,
    HttpModule,
    ScheduleModule.forRoot()
  ],
  controllers: [
    CoachingController, 
    SessionHistoryController, 
    FeedbackController,
    CoachController,
    SupportChatController
  ],
  providers: [
    CoachingService, 
    SessionHistoryService,
    SmartNotificationService,
    SupportChatService,
    SupportChatNotificationService
  ],
  exports: [
    CoachingService, 
    SessionHistoryService,
    SmartNotificationService,
    SupportChatService,
    SupportChatNotificationService
  ]
})
export class CoachingModule {}