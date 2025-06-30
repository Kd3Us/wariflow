export interface IVisualIdentityForm {
  logo?: File | null;
  logoBase64?: string; // Logo en base64
  logoMimeType?: string; // Type MIME du logo (image/png, image/jpeg, etc.)
  slogan: string;
  typography: string;
  valeurs: string;
  tonMessage: string;
  experienceUtilisateur: string;
}

export class VisualIdentityForm implements IVisualIdentityForm {
    constructor () {}
    logo?: File | null | undefined;
    logoBase64?: string;
    logoMimeType?: string;
    slogan = ""
    typography= "";
    valeurs= "";
    tonMessage= "";
    experienceUtilisateur= "";

}
