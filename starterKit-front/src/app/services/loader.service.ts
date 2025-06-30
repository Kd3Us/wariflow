import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCountSubject = new BehaviorSubject<number>(0);

  constructor() {}

  /**
   * Observable pour suivre l'état de chargement global
   */
  get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Démarre le chargement
   */
  startLoading(): void {
    const currentCount = this.loadingCountSubject.value;
    this.loadingCountSubject.next(currentCount + 1);
    this.loadingSubject.next(true);
  }

  /**
   * Arrête le chargement
   */
  stopLoading(): void {
    const currentCount = this.loadingCountSubject.value;
    const newCount = Math.max(0, currentCount - 1);
    this.loadingCountSubject.next(newCount);
    
    if (newCount === 0) {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Force l'arrêt de tous les chargements
   */
  forceStopLoading(): void {
    this.loadingCountSubject.next(0);
    this.loadingSubject.next(false);
  }

  /**
   * Retourne l'état actuel du chargement
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
