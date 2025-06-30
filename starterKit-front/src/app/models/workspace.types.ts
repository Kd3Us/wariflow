import { PersonForm, PersonFormData } from "./methodology/person.model";
import { VisualIdentityForm } from "./methodology/visual-identity.model";
import { StorytellingForm } from "./methodology/storytelling.model";
import { BusinessModelForm } from "./methodology/business.model";

export interface WorkspaceStep {
  id: number;
  title: string;
  completed: boolean;
  active: boolean;
}

export interface WorkspaceData {
  personForm?: PersonForm;
  personFormData?: PersonFormData;
  visualIdentityForm?: VisualIdentityForm;
  storytellingForm?: StorytellingForm;
  businessModelForm?: BusinessModelForm;
}

export { PersonForm, PersonFormData, VisualIdentityForm, StorytellingForm, BusinessModelForm };
