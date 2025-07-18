export enum ProjectManagementStage {
  PENDING = 'PENDING',
  INPROGRESS = 'INPROGRESS',
  TEST = 'TEST',
  DONE = 'DONE'
}

export interface ProjectManagementTask {
  id: string;
  title: string;
  description: string;
  stage: ProjectManagementStage;
  progress: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: TeamMember[];
  referents?: TeamMember[]; // Référents teams pour la tâche
  projectId: string; // Lié à un projet
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  estimatedHours?: number;
  actualHours?: number;
  comments: number;
  attachments: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}
