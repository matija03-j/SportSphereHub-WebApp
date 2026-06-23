import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReservationService, AvailabilitySlot } from '../../core/reservation.service';

interface Cell {
  start: Date;
  booked: boolean;
  past: boolean;
}

@Component({
  selector: 'app-weekly-calendar',
  imports: [DatePipe],
  templateUrl: './weekly-calendar.html',
  styleUrl: './weekly-calendar.css',
})
export class WeeklyCalendar implements OnChanges {
  @Input() facilityId = '';
  @Input() resourceId = '';
  @Input() openHour = 8;
  @Input() closeHour = 22;
  @Output() slotSelected = new EventEmitter<Date>();

  private reservationService = inject(ReservationService);

  weekStart = signal<Date>(startOfWeek(new Date()));
  slots = signal<AvailabilitySlot[]>([]);
  selected = signal<Date | null>(null);

  days = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

  ngOnChanges(): void {
    if (this.facilityId && this.resourceId) this.load();
  }

  get hours(): number[] {
    const arr = [];
    for (let h = this.openHour; h < this.closeHour; h++) arr.push(h);
    return arr;
  }

  dayDate(dayIndex: number): Date {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + dayIndex);
    return d;
  }

  cell(dayIndex: number, hour: number): Cell {
    const start = new Date(this.dayDate(dayIndex));
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 3600 * 1000);
    const booked = this.slots().some(
      (s) => new Date(s.start) < end && new Date(s.end) > start
    );
    return { start, booked, past: start.getTime() < Date.now() };
  }

  isSelected(c: Cell): boolean {
    return this.selected()?.getTime() === c.start.getTime();
  }

  pick(c: Cell): void {
    if (c.booked || c.past) return;
    this.selected.set(c.start);
    this.slotSelected.emit(c.start);
  }

  shiftWeek(delta: number): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + delta * 7);
    this.weekStart.set(d);
    this.load();
  }

  private load(): void {
    const from = new Date(this.weekStart());
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    this.reservationService
      .availability(this.facilityId, this.resourceId, from.toISOString(), to.toISOString())
      .subscribe((s) => this.slots.set(s));
  }
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
