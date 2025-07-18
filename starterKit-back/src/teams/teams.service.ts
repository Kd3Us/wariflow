import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from './entities/team-member.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamMember)
    private teamMemberRepository: Repository<TeamMember>,
  ) {}

  async findAll(): Promise<TeamMember[]> {
    return this.teamMemberRepository.find();
  }

  async findOne(id: string): Promise<TeamMember | null> {
    return this.teamMemberRepository.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<TeamMember[]> {
    return this.teamMemberRepository.findByIds(ids);
  }

  async create(teamMemberData: Partial<TeamMember>, organization?: string): Promise<TeamMember> {
    const team = {
      ...teamMemberData,
      organisation: organization || null, // Utiliser le bon nom de colonne
    }  
    const teamMember = this.teamMemberRepository.create(team);
    return this.teamMemberRepository.save(teamMember);
  }

  async update(id: string, updateData: Partial<TeamMember>): Promise<TeamMember | null> {
    await this.teamMemberRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.teamMemberRepository.delete(id);
  }


    async findByOrganisation(organisation: string): Promise<TeamMember[]> {
      return this.teamMemberRepository
        .createQueryBuilder('team_member')
        .where('team_member.organisation = :organisation', { organisation })
        .orderBy('team_member.createdAt', 'DESC')
        .getMany();
    }
}
