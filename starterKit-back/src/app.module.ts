import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [ProjectsModule, TeamsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}