import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './entities/team-member.entity';

@Injectable()
export class TeamsService implements OnModuleInit {
  constructor(
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
  ) {}

  async onModuleInit() {
    await this.initializeMockData();
  }

  private async initializeMockData() {
    const count = await this.teamMemberRepository.count();
    if (count === 0) {
      const mockMembers = [
        {
          name: 'Alice Martin',
          email: 'alice.martin@example.com',
          role: 'Product Manager',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
        },
        {
          name: 'Thomas Dubois',
          email: 'thomas.dubois@example.com',
          role: 'Frontend Developer',
          avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
        },
        {
          name: 'Sophie Leclerc',
          email: 'sophie.leclerc@example.com',
          role: 'UX Designer',
          avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
        },
        {
          name: 'Marc Rousseau',
          email: 'marc.rousseau@example.com',
          role: 'Backend Developer',
          avatar: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
        },
        {
          name: 'Emma Bernard',
          email: 'emma.bernard@example.com',
          role: 'Data Analyst',
          avatar: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
        }
      ];

      await this.teamMemberRepository.save(mockMembers);
    }
  }

  async findAll(): Promise<TeamMember[]> {
    return this.teamMemberRepository.find();
  }

  async findOne(id: string): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<TeamMember[]> {
    return this.teamMemberRepository.findByIds(ids);
  }

  async create(teamMemberData: Partial<TeamMember>): Promise<TeamMember> {
    const teamMember = this.teamMemberRepository.create(teamMemberData);
    return this.teamMemberRepository.save(teamMember);
  }

  async update(id: string, updateData: Partial<TeamMember>): Promise<TeamMember | null> {
    await this.teamMemberRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.teamMemberRepository.delete(id);
  }
}
