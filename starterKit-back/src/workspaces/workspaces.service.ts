import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Workspace } from './entities/workspace.entity';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(Workspace)
    private workspaceRepository: Repository<Workspace>,
  ) {}

  async create(createWorkspaceDto: CreateWorkspaceDto, userEmail: string): Promise<Workspace> {
    const workspace = this.workspaceRepository.create({
      projectId: createWorkspaceDto.projectId,
      userEmail: userEmail,
      currentStep: createWorkspaceDto.currentStep || 1,
      personForm: {
        nom: createWorkspaceDto.personForm?.nom || '',
        prenom: createWorkspaceDto.personForm?.prenom || '',
        sexe: createWorkspaceDto.personForm?.sexe || '',
        age: createWorkspaceDto.personForm?.age || null,
        nationalite: createWorkspaceDto.personForm?.nationalite || '',
        origine: createWorkspaceDto.personForm?.origine || '',
        description: createWorkspaceDto.personForm?.description || '',
        parcoursUtilisateur: createWorkspaceDto.personForm?.parcoursUtilisateur || '',
      },
      personFormData: createWorkspaceDto.personFormData ? {
        personForms: createWorkspaceDto.personFormData.personForms || [],
        currentPersonForm: createWorkspaceDto.personFormData.currentPersonForm || {
          nom: '',
          prenom: '',
          sexe: '',
          age: null,
          nationalite: '',
          origine: '',
          description: '',
          parcoursUtilisateur: ''
        }
      } : null,
      visualIdentityForm: {
        slogan: createWorkspaceDto.visualIdentityForm?.slogan || '',
        typography: createWorkspaceDto.visualIdentityForm?.typography || '',
        valeurs: createWorkspaceDto.visualIdentityForm?.valeurs || '',
        tonMessage: createWorkspaceDto.visualIdentityForm?.tonMessage || '',
        experienceUtilisateur: createWorkspaceDto.visualIdentityForm?.experienceUtilisateur || '',
      },
      storytellingForm: {
        archetypes: createWorkspaceDto.storytellingForm?.archetypes || [],
        structureNarrative: createWorkspaceDto.storytellingForm?.structureNarrative || '',
        pitch: createWorkspaceDto.storytellingForm?.pitch || '',
      },
      businessModelForm: {
        market: createWorkspaceDto.businessModelForm?.market || '',
        pricing: createWorkspaceDto.businessModelForm?.pricing || '',
      },
    });

    return this.workspaceRepository.save(workspace);
  }

  async findAll(): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      relations: ['project']
    });
  }

  async findOne(id: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({
      where: { id },
      relations: ['project']
    });
  }

  async findByProjectId(projectId: string): Promise<Workspace | null> {
    return this.workspaceRepository.findOne({
      where: { projectId },
      relations: ['project']
    });
  }

  async findByUserEmail(userEmail: string): Promise<Workspace[]> {
    return this.workspaceRepository.find({
      where: { userEmail },
      relations: ['project']
    });
  }

  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto): Promise<Workspace | null> {
    const workspace = await this.findOne(id);
    
    if (!workspace) {
      return null;
    }

    // Mise à jour des propriétés
    if (updateWorkspaceDto.currentStep !== undefined) {
      workspace.currentStep = updateWorkspaceDto.currentStep;
    }

    if (updateWorkspaceDto.personForm) {
      workspace.personForm = {
        ...workspace.personForm,
        ...updateWorkspaceDto.personForm,
      };
    }

    if (updateWorkspaceDto.personFormData !== undefined) {
      if (updateWorkspaceDto.personFormData === null) {
        workspace.personFormData = null;
      } else {
        workspace.personFormData = {
          personForms: updateWorkspaceDto.personFormData.personForms || [],
          currentPersonForm: updateWorkspaceDto.personFormData.currentPersonForm || {
            nom: '',
            prenom: '',
            sexe: '',
            age: null,
            nationalite: '',
            origine: '',
            description: '',
            parcoursUtilisateur: ''
          }
        };
      }
    }

    if (updateWorkspaceDto.visualIdentityForm) {
      workspace.visualIdentityForm = {
        ...workspace.visualIdentityForm,
        ...updateWorkspaceDto.visualIdentityForm,
      };
    }

    if (updateWorkspaceDto.storytellingForm) {
      workspace.storytellingForm = {
        ...workspace.storytellingForm,
        ...updateWorkspaceDto.storytellingForm,
      };
    }

    if (updateWorkspaceDto.businessModelForm) {
      workspace.businessModelForm = {
        ...workspace.businessModelForm,
        ...updateWorkspaceDto.businessModelForm,
      };
    }

    return this.workspaceRepository.save(workspace);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.workspaceRepository.delete(id);
    return result.affected > 0;
  }
}
