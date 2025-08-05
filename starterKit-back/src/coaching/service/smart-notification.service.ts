import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { HttpService } from '@nestjs/axios';

export interface SmartNotificationData {
  sessionId: string;
  userId: string;
  coachId: string;
  coachName: string;
  userName: string;
  userEmail: string;
  sessionDate: string;
  sessionTime: string;
  duration: number;
  topic: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  reminderTiming: '24h' | '12h' | '6h' | '1h' | 'all';
  quietHours: { start: string; end: string };
  timezone: string;
}

@Injectable()
export class SmartNotificationService {
  private readonly logger = new Logger(SmartNotificationService.name);
  private transporter: nodemailer.Transporter;
  private pendingNotifications: Map<string, any> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();

  constructor(private readonly httpService: HttpService) {
    this.initializeEmailService();
  }

  private initializeEmailService() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async scheduleSessionNotifications(sessionData: SmartNotificationData): Promise<void> {
    const preferences = await this.getUserPreferences(sessionData.userId);
    const sessionDateTime = new Date(`${sessionData.sessionDate} ${sessionData.sessionTime}`);

    // Notification de confirmation immédiate
    if (preferences.emailNotifications) {
      await this.sendConfirmationEmail(sessionData);
    }

    // Programmer les rappels selon les préférences
    const reminderTimes = this.calculateReminderTimes(sessionDateTime, preferences.reminderTiming);
    
    for (const reminderTime of reminderTimes) {
      const notificationId = `${sessionData.sessionId}_${reminderTime.getTime()}`;
      this.pendingNotifications.set(notificationId, {
        sessionData,
        reminderTime,
        type: this.getReminderType(reminderTime, sessionDateTime),
        preferences
      });
    }

    this.logger.log(`Notifications programmées pour la session ${sessionData.sessionId}`);
  }

  private calculateReminderTimes(sessionDateTime: Date, timing: string): Date[] {
    const reminders: Date[] = [];
    const session = new Date(sessionDateTime);

    switch (timing) {
      case 'all':
        reminders.push(new Date(session.getTime() - 24 * 60 * 60 * 1000)); // 24h
        reminders.push(new Date(session.getTime() - 12 * 60 * 60 * 1000)); // 12h
        reminders.push(new Date(session.getTime() - 6 * 60 * 60 * 1000));  // 6h
        reminders.push(new Date(session.getTime() - 60 * 60 * 1000));      // 1h
        break;
      case '24h':
        reminders.push(new Date(session.getTime() - 24 * 60 * 60 * 1000));
        break;
      case '12h':
        reminders.push(new Date(session.getTime() - 12 * 60 * 60 * 1000));
        break;
      case '6h':
        reminders.push(new Date(session.getTime() - 6 * 60 * 60 * 1000));
        break;
      case '1h':
        reminders.push(new Date(session.getTime() - 60 * 60 * 1000));
        break;
    }

    return reminders.filter(reminder => reminder > new Date());
  }

  private getReminderType(reminderTime: Date, sessionTime: Date): string {
    const diff = sessionTime.getTime() - reminderTime.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours >= 24) return '24h';
    if (hours >= 12) return '12h';
    if (hours >= 6) return '6h';
    return '1h';
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingNotifications(): Promise<void> {
    const now = new Date();
    const toProcess: string[] = [];

    for (const [id, notification] of this.pendingNotifications) {
      if (notification.reminderTime <= now) {
        toProcess.push(id);
      }
    }

    for (const id of toProcess) {
      const notification = this.pendingNotifications.get(id);
      try {
        await this.sendReminderNotification(notification);
        this.pendingNotifications.delete(id);
        this.logger.log(`Rappel envoyé: ${id}`);
      } catch (error) {
        this.logger.error(`Erreur envoi rappel ${id}:`, error);
      }
    }
  }

  private async sendConfirmationEmail(sessionData: SmartNotificationData): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Session confirmée !</h2>
        <p>Bonjour ${sessionData.userName},</p>
        <p>Votre session de coaching avec <strong>${sessionData.coachName}</strong> est confirmée.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Détails de la session:</h3>
          <p><strong>Date:</strong> ${this.formatDate(sessionData.sessionDate)}</p>
          <p><strong>Heure:</strong> ${sessionData.sessionTime}</p>
          <p><strong>Durée:</strong> ${sessionData.duration} minutes</p>
          <p><strong>Sujet:</strong> ${sessionData.topic}</p>
        </div>
        
        <p>Vous recevrez des rappels automatiques avant votre session.</p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Cette notification a été envoyée automatiquement par StartupKit.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@startupkit.com',
      to: sessionData.userEmail,
      subject: `Session confirmée avec ${sessionData.coachName}`,
      html
    });
  }

  private async sendReminderNotification(notification: any): Promise<void> {
    const { sessionData, type, preferences } = notification;
    
    if (this.isInQuietHours(preferences)) {
      // Reporter la notification après les heures de silence
      const nextSend = this.getNextSendTime(preferences);
      notification.reminderTime = nextSend;
      return;
    }

    if (preferences.emailNotifications && ['24h', '12h', '6h'].includes(type)) {
      await this.sendReminderEmail(sessionData, type);
    }

    // Pour les notifications push (à implémenter selon votre système)
    if (preferences.pushNotifications && ['1h', '6h'].includes(type)) {
      await this.sendPushNotification(sessionData, type);
    }
  }

  private async sendReminderEmail(sessionData: SmartNotificationData, type: string): Promise<void> {
    const timeText = this.getTimeText(type);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Rappel de session</h2>
        <p>Bonjour ${sessionData.userName},</p>
        <p>Votre session de coaching avec <strong>${sessionData.coachName}</strong> ${timeText}.</p>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Détails:</h3>
          <p><strong>Date:</strong> ${this.formatDate(sessionData.sessionDate)}</p>
          <p><strong>Heure:</strong> ${sessionData.sessionTime}</p>
          <p><strong>Sujet:</strong> ${sessionData.topic}</p>
        </div>
        
        <p>Préparez vos questions et objectifs pour tirer le maximum de cette session.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@startupkit.com',
      to: sessionData.userEmail,
      subject: `Rappel: Session ${timeText} avec ${sessionData.coachName}`,
      html
    });
  }

  private async sendPushNotification(sessionData: SmartNotificationData, type: string): Promise<void> {
    // Intégration avec votre système de push notifications existant
    const timeText = this.getTimeText(type);
    
    this.logger.log(`Push notification: Session ${timeText} avec ${sessionData.coachName}`);
    // Ici vous pouvez intégrer avec Firebase, OneSignal, etc.
  }

  async cancelSessionNotifications(sessionId: string): Promise<void> {
    const toRemove: string[] = [];
    
    for (const [id, notification] of this.pendingNotifications) {
      if (notification.sessionData.sessionId === sessionId) {
        toRemove.push(id);
      }
    }
    
    toRemove.forEach(id => this.pendingNotifications.delete(id));
    this.logger.log(`Notifications annulées pour la session ${sessionId}`);
  }

  async rescheduleSessionNotifications(sessionId: string, newSessionData: SmartNotificationData): Promise<void> {
    await this.cancelSessionNotifications(sessionId);
    await this.scheduleSessionNotifications(newSessionData);
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    if (!this.userPreferences.has(userId)) {
      // Valeurs par défaut
      this.userPreferences.set(userId, {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        reminderTiming: 'all',
        quietHours: { start: '22:00', end: '08:00' },
        timezone: 'Europe/Paris'
      });
    }
    return this.userPreferences.get(userId)!;
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    this.userPreferences.set(userId, updated);
    return updated;
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const { start, end } = preferences.quietHours;
    
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  private getNextSendTime(preferences: NotificationPreferences): Date {
    const now = new Date();
    const [hours, minutes] = preferences.quietHours.end.split(':').map(Number);
    const nextSend = new Date();
    nextSend.setHours(hours, minutes, 0, 0);
    
    if (nextSend <= now) {
      nextSend.setDate(nextSend.getDate() + 1);
    }
    
    return nextSend;
  }

  private getTimeText(type: string): string {
    switch (type) {
      case '24h': return 'a lieu demain';
      case '12h': return 'a lieu dans 12 heures';
      case '6h': return 'a lieu dans 6 heures';
      case '1h': return 'commence dans 1 heure';
      default: return 'approche';
    }
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}