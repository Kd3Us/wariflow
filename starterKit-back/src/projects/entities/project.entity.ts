import { ProjectStage } from '../../common/enums/project-stage.enum';
import { TeamMember } from '../../common/interfaces/team-member.interface';

export class Project {
  id: string;
  title: string;
  description: string;
  stage: ProjectStage;
  progress: number;
  deadline: Date;
  createdAt: Date;
  updatedAt: Date;
  team: TeamMember[];
  comments: number;
  attachments: number;
  isReminderActive: boolean;
  reminderDate?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
}