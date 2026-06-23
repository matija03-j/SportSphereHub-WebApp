import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainingService } from '../../../core/training.service';
import { SportService } from '../../../core/sport.service';
import { Sport, Trainer, Training } from '../../../core/models';

@Component({
  selector: 'app-trainings',
  imports: [DatePipe, FormsModule],
  templateUrl: './trainings.html',
})
export class Trainings implements OnInit {
  private trainingService = inject(TrainingService);
  private sportService = inject(SportService);

  trainers = signal<Trainer[]>([]);
  mine = signal<Training[]>([]);
  sports = signal<Sport[]>([]);
  sportFilter = '';
  message = signal('');
  error = signal('');

  bookingFor = signal<Trainer | null>(null);
  bookStart = '';
  bookDuration = 1;

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.loadTrainers();
    this.loadMine();
  }

  loadTrainers(): void {
    this.trainingService.trainers(undefined, this.sportFilter || undefined).subscribe((t) => this.trainers.set(t));
  }
  loadMine(): void {
    this.trainingService.mine().subscribe((t) => this.mine.set(t));
  }

  startBooking(t: Trainer): void {
    this.bookingFor.set(t);
    this.message.set('');
    this.error.set('');
  }

  book(): void {
    const t = this.bookingFor();
    if (!t || !this.bookStart) return;
    this.trainingService
      .book({ trainer: t._id, start: new Date(this.bookStart).toISOString(), durationHours: this.bookDuration })
      .subscribe({
        next: () => {
          this.message.set('Trening je zakazan.');
          this.bookingFor.set(null);
          this.bookStart = '';
          this.loadMine();
        },
        error: (err) => this.error.set(err?.error?.message || 'Zakazivanje nije uspelo.'),
      });
  }
}
