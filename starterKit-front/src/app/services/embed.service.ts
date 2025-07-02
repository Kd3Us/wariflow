import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmbedService {

    // BehaviorSubject pour observer les changements du token
    private embedSubject = new BehaviorSubject<boolean | null>(null);
    
    // Observable public pour que les composants puissent s'abonner
    public embed$ = this.embedSubject.asObservable();


  constructor() {}

    /**
   * Récupère le embed depuis le sessionStorage
   * @returns string | null
   */
    public getEmbed(): boolean | null {
        const isEmbed = sessionStorage.getItem('isEmbed');
        return Boolean(isEmbed);
      }

        /**
   * Sauvegarde le embed dans le sessionStorage
   * @param embed string
   */
    public setEmbed(embed: boolean): void {
    sessionStorage.setItem('isEmbed', String(embed));
    // Émettre le nouveau Embed décodé
    this.embedSubject.next(embed);
  }


    /**
   * Récupère le embed depuis les paramètres de l'URL
   * @returns boolean
   */
    public getEmbedFromUrl(): boolean {
      const urlParams = new URLSearchParams(window.location.search);
      const embed = urlParams.get('embed');
      return Boolean(embed);
    }
    
}