import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Coach } from './coach.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  coachId: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column('text')
  comment: string;

  @Column()
  sessionTopic: string;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => Coach, coach => coach.reviews)
  @JoinColumn({ name: 'coachId' })
  coach: Coach;
}