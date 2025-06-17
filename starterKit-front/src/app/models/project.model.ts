export enum ProjectStage {
  IDEE = 'IDEE',
  MVP = 'MVP',
  TRACTION = 'TRACTION',
  LEVEE = 'LEVEE'
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  stage: ProjectStage;
  progress: number;
  deadline?: Date;
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