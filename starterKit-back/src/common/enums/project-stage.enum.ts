export enum ProjectStage {
  IDEE = 'IDEE',
  MVP = 'MVP',
  TRACTION = 'TRACTION',
  LEVEE = 'LEVEE',
}

export const PROJECT_STAGE_ORDER = [
  ProjectStage.IDEE,
  ProjectStage.MVP,
  ProjectStage.TRACTION,
  ProjectStage.LEVEE,
];

export const PROJECT_STAGE_LABELS = {
  [ProjectStage.IDEE]: 'Idée',
  [ProjectStage.MVP]: 'MVP',
  [ProjectStage.TRACTION]: 'Traction',
  [ProjectStage.LEVEE]: 'Levée',
};