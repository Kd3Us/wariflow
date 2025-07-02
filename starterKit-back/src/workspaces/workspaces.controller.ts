import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';
import { Request } from 'express';
import { decode } from 'jsonwebtoken';

@ApiTags('workspaces')
@Controller('workspaces')
@UseGuards(TokenAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer un nouveau workspace',
    description: 'Crée un nouveau workspace lié à l\'utilisateur authentifié. Le workspace sera automatiquement associé à l\'email de l\'utilisateur récupéré depuis le token d\'authentification.'
  })
  @ApiResponse({
    status: 201,
    description: 'Workspace créé avec succès',
    schema: {
      example: {
        id: 'workspace-uuid-456',
        projectId: 'project-uuid-123',
        userEmail: 'user@example.com',
        currentStep: 1,
        personForm: {
          nom: 'Dupont',
          prenom: 'Jean',
          sexe: 'Homme',
          age: 35,
          nationalite: 'Française',
          origine: 'Paris',
          description: 'Entrepreneur passionné par la technologie',
          parcoursUtilisateur: 'Ingénieur informatique avec 10 ans d\'expérience'
        },
        visualIdentityForm: {
          logoBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          logoMimeType: 'image/png',
          slogan: 'Innovation et Excellence',
          typography: 'Moderne et épurée',
          valeurs: 'Innovation, Qualité, Proximité client',
          tonMessage: 'Professionnel mais accessible',
          experienceUtilisateur: 'Intuitive et engageante'
        },
        storytellingForm: {
          archetypes: ['Le Créateur', 'L\'Explorateur'],
          structureNarrative: 'Histoire de transformation digitale',
          pitch: 'Nous aidons les entreprises à se digitaliser avec des solutions innovantes et sur-mesure.'
        },
        businessModelForm: {
          market: 'B2B - PME et ETI',
          pricing: 'Freemium avec abonnements premium'
        },
        createdAt: '2025-01-26T20:30:00.000Z',
        updatedAt: '2025-01-26T20:30:00.000Z'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification manquant ou invalide'
  })
  @ApiResponse({
    status: 404,
    description: 'Email utilisateur non trouvé dans le token'
  })
  @ApiBody({
    description: 'Données pour créer le workspace. Tous les champs sont optionnels.',
    examples: {
      'Workspace minimal': {
        summary: 'Création d\'un workspace minimal',
        description: 'Exemple de création d\'un workspace avec seulement les informations de base',
        value: {
          projectId: 'project-uuid-123',
          currentStep: 1
        }
      },
      'Workspace complet': {
        summary: 'Création d\'un workspace complet',
        description: 'Exemple de création d\'un workspace avec toutes les informations remplies',
        value: {
          currentStep: 2,
          personForm: {
            nom: 'Dupont',
            prenom: 'Jean',
            sexe: 'Homme',
            age: 35,
            nationalite: 'Française',
            origine: 'Paris',
            description: 'Entrepreneur passionné par la technologie',
            parcoursUtilisateur: 'Ingénieur informatique avec 10 ans d\'expérience'
          },
          visualIdentityForm: {
            slogan: 'Innovation et Excellence',
            typography: 'Moderne et épurée',
            valeurs: 'Innovation, Qualité, Proximité client',
            tonMessage: 'Professionnel mais accessible',
            experienceUtilisateur: 'Intuitive et engageante'
          }
        }
      },
      'Workspace avec storytelling': {
        summary: 'Workspace avec éléments de storytelling',
        description: 'Exemple incluant les éléments de storytelling et business model',
        value: {
          currentStep: 4,
          storytellingForm: {
            archetypes: ['Le Créateur', 'L\'Explorateur'],
            structureNarrative: 'Histoire de transformation digitale',
            pitch: 'Nous aidons les entreprises à se digitaliser avec des solutions innovantes et sur-mesure.'
          },
          businessModelForm: {
            market: 'B2B - PME et ETI',
            pricing: 'Freemium avec abonnements premium'
          }
        }
      }
    }
  })
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Req() request: Request) {

    const userEmail = request['userInfo']?.['sub'];
    
    if (!userEmail) {
      throw new NotFoundException('User email not found in token');
    }
    
    return this.workspacesService.create(createWorkspaceDto, userEmail);
  }

  @Get()
  @ApiBearerAuth()
  findAll() {
    return this.workspacesService.findAll();
  }

  @Get('user/me')
  @ApiBearerAuth()
  findMyWorkspaces(@Req() request: Request) {
    const userEmail = request['userInfo']?.['sub'];
    if (!userEmail) {
      throw new NotFoundException('User email not found in token');
    }
    return this.workspacesService.findByUserEmail(userEmail);
  }

  @Get(':id')
  @ApiBearerAuth()
  async findOne(@Param('id') id: string, @Req() request: Request) {
    const userEmail = request['userInfo']?.['sub'];
    
    if (!userEmail) {
      throw new NotFoundException('User email not found in token');
    }
    
    const workspace = await this.workspacesService.findOne(id);
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    
    // Vérifier que le workspace appartient à l'utilisateur
    if (workspace.userEmail !== userEmail) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    
    return workspace;
  }

  @Get('project/:projectId')
  @ApiBearerAuth()
  async findByProjectId(@Param('projectId') projectId: string, @Req() request: Request) {
    const userEmail = request['userInfo']?.['sub'];
    
    if (!userEmail) {
      throw new NotFoundException('User email not found in token');
    }
    
    const workspace = await this.workspacesService.findByProjectId(projectId);
    if (!workspace) {
      throw new NotFoundException(`Workspace for project ${projectId} not found`);
    }
    
    // Vérifier que le workspace appartient à l'utilisateur
    if (workspace.userEmail !== userEmail) {
      throw new NotFoundException(`Workspace for project ${projectId} not found`);
    }
    
    return workspace;
  }

  @Patch(':id')
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto, @Req() request: Request) {
    const userEmail = request['userInfo']?.['sub'];
    
    if (!userEmail) {
      throw new NotFoundException('User email not found in token');
    }
    
    // Vérifier que le workspace existe et appartient à l'utilisateur
    const existingWorkspace = await this.workspacesService.findOne(id);
    if (!existingWorkspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    
    if (existingWorkspace.userEmail !== userEmail) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    
    const workspace = await this.workspacesService.update(id, updateWorkspaceDto);
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    return workspace;
  }

  @Delete(':id')
  @ApiBearerAuth()
  async remove(@Param('id') id: string, @Req() request: Request) {
    const userEmail = request['userInfo']?.['sub'];

    if (!userEmail) {
      throw new NotFoundException('User email not found in token');
    }
    
    // Vérifier que le workspace existe et appartient à l'utilisateur
    const existingWorkspace = await this.workspacesService.findOne(id);
    if (!existingWorkspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    
    if (existingWorkspace.userEmail !== userEmail) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    
    const success = await this.workspacesService.remove(id);
    if (!success) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    return { message: 'Workspace deleted successfully' };
  }

}
