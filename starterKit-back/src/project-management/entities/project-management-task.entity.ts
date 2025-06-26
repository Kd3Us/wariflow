import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { TeamMember } from '../../teams/entities/team-member.entity';
import { Project } from '../../projects/entities/project.entity';

export enum ProjectManagementStage {
  PENDING = 'PENDING',
  INPROGRESS = 'INPROGRESS',
  TEST = 'TEST',
  DONE = 'DONE'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

@Entity('project_management_tasks')
export class ProjectManagementTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectManagementStage,
    default: ProjectManagementStage.PENDING
  })
  stage: ProjectManagementStage;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority: TaskPriority;

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column({ type: 'int', nullable: true })
  estimatedHours: number | null;

  @Column({ type: 'int', nullable: true })
  actualHours: number | null;

  @ManyToMany(() => TeamMember, { eager: true })
  @JoinTable({
    name: 'task_assigned_members',
    joinColumn: { name: 'task_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'team_member_id', referencedColumnName: 'id' }
  })
  assignedTo: TeamMember[];

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  attachments: number;
}
