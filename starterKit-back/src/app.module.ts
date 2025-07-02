import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { TeamsModule } from './teams/teams.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    ProjectsModule, 
    TeamsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}