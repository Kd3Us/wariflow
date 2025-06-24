import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { TeamsModule } from './teams/teams.module';
import { CommonModule } from './common/common.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [ProjectsModule, TeamsModule, CommonModule, ChatbotModule],
  controllers: [],
  providers: [],
})
export class AppModule {}