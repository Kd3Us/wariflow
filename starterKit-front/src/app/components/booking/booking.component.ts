import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface Booking {
  id: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  reminderSent?: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminder24h: boolean;
  reminder1h: boolean;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  selectedDate: Date = new Date();
  selectedTime: string = '';
  bookings: Booking[] = [];
  showBookingForm: boolean = false;
  bookingForm: FormGroup;
  
  notifications: NotificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    reminder24h: true,
    reminder1h: true
  };

  timeSlots: TimeSlot[] = [
    { id: '1', time: '09:00', available: true },
    { id: '2', time: '10:00', available: true },
    { id: '3', time: '11:00', available: false },
    { id: '4', time: '14:00', available: true },
    { id: '5', time: '15:00', available: true },
    { id: '6', time: '16:00', available: true },
    { id: '7', time: '17:00', available: true }
  ];

  services: string[] = [
    'Consultation',
    'Massage thérapeutique',
    'Séance de coaching',
    'Formation'
  ];

  monthNames: string[] = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  dayNames: string[] = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  constructor(private formBuilder: FormBuilder) {
    this.bookingForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      service: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.checkReminders();
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkReminders());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkReminders(): void {
    const now = new Date();
    this.bookings.forEach(booking => {
      const bookingDateTime = new Date(`${booking.date} ${booking.time}`);
      const timeDiff = bookingDateTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 3600);

      if (hoursDiff <= 24 && hoursDiff > 23 && !booking.reminderSent && this.notifications.reminder24h) {
        this.sendReminder(booking, '24h');
      }
      if (hoursDiff <= 1 && hoursDiff > 0 && this.notifications.reminder1h) {
        this.sendReminder(booking, '1h');
      }
    });
  }

  async sendReminder(booking: Booking, type: string): Promise<void> {
    try {
      const response = await fetch('/api/send-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking,
          reminderType: type,
          settings: this.notifications
        })
      });

      if (response.ok) {
        this.bookings = this.bookings.map(b => 
          b.id === booking.id ? { ...b, reminderSent: true } : b
        );
      }
    } catch (error) {
      console.error('Erreur envoi rappel:', error);
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getDaysInMonth(date: Date): (Date | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }

  isDateAvailable(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  getBookingsForDate(date: string): Booking[] {
    return this.bookings.filter(booking => booking.date === date);
  }

  handleDateSelect(date: Date): void {
    if (this.isDateAvailable(date)) {
      this.selectedDate = date;
      this.selectedTime = '';
    }
  }

  handleTimeSelect(time: string): void {
    this.selectedTime = time;
    this.showBookingForm = true;
  }

  async handleBookingSubmit(): Promise<void> {
    if (!this.bookingForm.valid) return;
    
    const formValue = this.bookingForm.value;
    const newBooking: Booking = {
      id: Date.now().toString(),
      date: this.formatDate(this.selectedDate),
      time: this.selectedTime,
      clientName: formValue.name,
      clientEmail: formValue.email,
      service: formValue.service,
      status: 'confirmed'
    };

    try {
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          booking: newBooking,
          clientInfo: formValue,
          notifications: this.notifications
        })
      });

      if (response.ok) {
        this.bookings = [...this.bookings, newBooking];
        await this.syncWithGoogleCalendar(newBooking);
        this.showBookingForm = false;
        this.bookingForm.reset();
        this.selectedTime = '';
      }
    } catch (error) {
      console.error('Erreur création réservation:', error);
    }
  }

  async syncWithGoogleCalendar(booking: Booking): Promise<void> {
    try {
      const response = await fetch('/api/google-calendar/create-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `${booking.service} - ${booking.clientName}`,
          description: `Rendez-vous avec ${booking.clientName}`,
          start: {
            dateTime: `${booking.date}T${booking.time}:00`,
            timeZone: 'Europe/Paris'
          },
          end: {
            dateTime: `${booking.date}T${this.addHour(booking.time)}:00`,
            timeZone: 'Europe/Paris'
          },
          attendees: [
            { email: booking.clientEmail }
          ]
        })
      });

      if (!response.ok) {
        console.error('Erreur synchronisation Google Calendar');
      }
    } catch (error) {
      console.error('Erreur sync Google Calendar:', error);
    }
  }

  addHour(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const newHours = (hours + 1).toString().padStart(2, '0');
    return `${newHours}:${minutes.toString().padStart(2, '0')}`;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      const response = await fetch(`/api/cancel-booking/${bookingId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.bookings = this.bookings.filter(b => b.id !== bookingId);
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  }

  async modifyBooking(bookingId: string, newDate: string, newTime: string): Promise<void> {
    try {
      const response = await fetch(`/api/modify-booking/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: newDate,
          time: newTime
        })
      });

      if (response.ok) {
        this.bookings = this.bookings.map(b => 
          b.id === bookingId ? { ...b, date: newDate, time: newTime } : b
        );
      }
    } catch (error) {
      console.error('Erreur modification:', error);
    }
  }

  previousMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() - 1, 1);
  }

  nextMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 1);
  }

  closeBookingForm(): void {
    this.showBookingForm = false;
    this.bookingForm.reset();
    this.selectedTime = '';
  }

  isTimeSlotBooked(time: string): boolean {
    return this.getBookingsForDate(this.formatDate(this.selectedDate))
      .some(booking => booking.time === time);
  }

  getUpcomingBookings(): Booking[] {
    return this.bookings
      .filter(booking => new Date(`${booking.date} ${booking.time}`) > new Date())
      .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
      .slice(0, 5);
  }

  updateNotificationSetting(setting: keyof NotificationSettings, value: boolean): void {
    this.notifications = {
      ...this.notifications,
      [setting]: value
    };
  }
}