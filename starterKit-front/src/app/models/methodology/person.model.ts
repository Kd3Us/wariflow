
export interface IPersonForm {
    nom: string;
    prenom: string;
    sexe: string;
    age: number | null;
    nationalite: string;
    origine: string;
    description: string;
    parcoursUtilisateur: string;
  }
  


export class PersonForm implements IPersonForm {

  constructor() {}

  nom: string = "";
  prenom: string = "";
  sexe: string = "";
  age: number | null = 0;
  nationalite: string = "";
  origine: string = "";
  description: string = "";
  parcoursUtilisateur: string = "";
  
}
