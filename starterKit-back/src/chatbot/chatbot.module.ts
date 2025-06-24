import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ProjectsModule } from '../projects/projects.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ProjectsModule, CommonModule],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}