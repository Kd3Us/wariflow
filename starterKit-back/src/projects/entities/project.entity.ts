import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { ProjectStage } from '../../common/enums/project-stage.enum';
import { TeamMember } from '../../teams/entities/team-member.entity';
import { ProjectManagementTask } from '../../project-management/entities/project-management-task.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStage,
    default: ProjectStage.IDEE
  })
  stage: ProjectStage;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => TeamMember, { eager: true })
  @JoinTable({
    name: 'project_team_members',
    joinColumn: { name: 'project_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'team_member_id', referencedColumnName: 'id' }
  })
  team: TeamMember[];

  @Column({ type: 'int', default: 0 })
  comments: number;

  @Column({ type: 'int', default: 0 })
  attachments: number;

  @Column({ type: 'boolean', default: false })
  isReminderActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reminderDate?: Date;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  })
  priority: 'LOW' | 'MEDIUM' | 'HIGH';

  @Column('simple-array', { default: '' })
  tags: string[];

  @Column()
  organisation: string; // Email de l'utilisateur qui a créé le projet

  @OneToMany(() => ProjectManagementTask, task => task.project)
  tasks: ProjectManagementTask[];
}
