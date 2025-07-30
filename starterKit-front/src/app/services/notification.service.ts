import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  
  constructor() {}

  getNotifications() {
    return this.notifications$.asObservable();
  }

  private addNotification(notification: Omit<Notification, 'id'>) {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      duration: notification.duration || 5000
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, newNotification]);

    if (!newNotification.persistent) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }

  success(title: string, message?: string, duration?: number) {
    return this.addNotification({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(title: string, message?: string, persistent: boolean = false) {
    return this.addNotification({
      type: 'error',
      title,
      message,
      persistent,
      duration: persistent ? undefined : 8000
    });
  }

  warning(title: string, message?: string, duration?: number) {
    return this.addNotification({
      type: 'warning',
      title,
      message,
      duration: duration || 6000
    });
  }

  info(title: string, message?: string, duration?: number) {
    return this.addNotification({
      type: 'info',
      title,
      message,
      duration
    });
  }

  removeNotification(id: string) {
    const currentNotifications = this.notifications$.value;
    this.notifications$.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  clearAll() {
    this.notifications$.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}