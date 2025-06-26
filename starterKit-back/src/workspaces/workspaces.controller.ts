import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TokenAuthGuard } from '../common/guards/token-auth.guard';

@ApiTags('workspaces')
@Controller('workspaces')
//@UseGuards(TokenAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiBearerAuth()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(createWorkspaceDto);
  }

  @Get()
  @ApiBearerAuth()
  findAll() {
    return this.workspacesService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    const workspace = this.workspacesService.findOne(id);
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    return workspace;
  }

  @Get('project/:projectId')
  @ApiBearerAuth()
  findByProjectId(@Param('projectId') projectId: string) {
    const workspace = this.workspacesService.findByProjectId(projectId);
    if (!workspace) {
      throw new NotFoundException(`Workspace for project ${projectId} not found`);
    }
    return workspace;
  }

  @Patch(':id')
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = this.workspacesService.update(id, updateWorkspaceDto);
    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    return workspace;
  }

  @Delete(':id')
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    const success = this.workspacesService.remove(id);
    if (!success) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }
    return { message: 'Workspace deleted successfully' };
  }

}
