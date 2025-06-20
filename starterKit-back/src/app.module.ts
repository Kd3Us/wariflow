import { Module } from '@nestjs/common';
import { ProjectsModule } from './projects/projects.module';
import { TeamsModule } from './teams/teams.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [ProjectsModule, TeamsModule, CommonModule],
  controllers: [],
  providers: [],
})
export class AppModule {}