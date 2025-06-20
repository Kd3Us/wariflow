import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TeamsModule } from '../teams/teams.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TeamsModule, CommonModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}