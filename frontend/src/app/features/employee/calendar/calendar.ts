import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { EmployeeService } from '../../../core/employee.service';
import { ReservationService, AvailabilitySlot } from '../../../core/reservation.service';
import { Facility } from '../../../core/models';

interface Cell {
  start: Date;
  reservation: AvailabilitySlot | null;
}

@Component({
  selector: 'app-employee-calendar',
  imports: [DatePipe, FormsModule, DragDropModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class EmployeeCalendar implements OnInit {
  private employeeService = inject(EmployeeService);
  private reservationService = inject(ReservationService);

  facilities = signal<Facility[]>([]);
  facilityId = '';
  resourceId = '';
  slots = signal<AvailabilitySlot[]>([]);
  weekStart = signal<Date>(startOfWeek(new Date()));
  message = signal('');
  error = signal('');

  days = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

  // Plain methods (not computed): they must read the ngModel-bound plain
  // properties `facilityId`/`resourceId`, which are NOT signals, so a computed
  // would never recompute when the dropdowns change.
  selectedFacility(): Facility | undefined {
    return this.facilities().find((f) => f._id === this.facilityId);
  }
  selectedResource() {
    return this.selectedFacility()?.resources.find((r) => r._id === this.resourceId);
  }
  isMovable(): boolean {
    const t = this.selectedResource()?.type;
    return t === 'closed' || t === 'hall';
  }

  ngOnInit(): void {
    this.employeeService.facilities().subscribe((f) => this.facilities.set(f));
  }

  get hours(): number[] {
    const f = this.selectedFacility();
    const open = Number(f?.workingHours.open.split(':')[0] ?? 8);
    const close = Number(f?.workingHours.close.split(':')[0] ?? 22);
    return Array.from({ length: close - open }, (_, i) => open + i);
  }

  onFacilityChange(): void {
    this.resourceId = '';
    this.slots.set([]);
  }

  onResourceChange(): void {
    if (this.resourceId) this.load();
  }

  dayDate(i: number): Date {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + i);
    return d;
  }

  cell(dayIndex: number, hour: number): Cell {
    const start = new Date(this.dayDate(dayIndex));
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 3600 * 1000);
    const reservation =
      this.slots().find((s) => new Date(s.start) < end && new Date(s.end) > start) || null;
    // Show the card in the hour cell where the reservation begins (handles
    // reservations that don't start exactly on the full hour too).
    const rStart = reservation && new Date(reservation.start);
    const startsHere = !!rStart && rStart >= start && rStart < end;
    return { start, reservation: startsHere ? reservation : null };
  }

  shiftWeek(delta: number): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + delta * 7);
    this.weekStart.set(d);
    this.load();
  }

  drop(event: CdkDragDrop<Date>, targetStart: Date): void {
    const reservation = event.item.data as AvailabilitySlot;
    if (!reservation) return;
    this.employeeService.move(reservation._id, targetStart.toISOString()).subscribe({
      next: () => { this.message.set('Termin je premešten.'); this.error.set(''); this.load(); },
      error: (err) => this.error.set(err?.error?.message || 'Premeštanje nije uspelo.'),
    });
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
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}
