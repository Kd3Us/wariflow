import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module';
import { TeamsModule } from './teams/teams.module';
import { CommonModule } from './common/common.module';
import { LoggerModule } from './common/logger/logger.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectManagementModule } from './project-management/project-management.module';
import { DatabaseModule } from './database/database.module';
import { ChatbotModule } from './chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    ProjectsModule,
    TeamsModule,
    CommonModule,
    LoggerModule,
    WorkspacesModule,
    ProjectManagementModule,
    ChatbotModule
  ],
})
export class AppModule {}