import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectManagementService } from './project-management.service';
import { ProjectManagementController } from './project-management.controller';
import { ProjectManagementTask } from './entities/project-management-task.entity';
import { CommonModule } from '../common/common.module';
import { ProjectsModule } from '../projects/projects.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectManagementTask]),
    CommonModule,
    ProjectsModule,
    TeamsModule
  ],
  controllers: [ProjectManagementController],
  providers: [ProjectManagementService],
  exports: [ProjectManagementService],
})
export class ProjectManagementModule {}
