import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EmployeeService } from '../../../core/employee.service';

@Component({
  selector: 'app-employee-reservations',
  imports: [DatePipe],
  templateUrl: './reservations.html',
})
export class EmployeeReservations implements OnInit {
  private employeeService = inject(EmployeeService);

  reservations = signal<any[]>([]);
  trainings = signal<any[]>([]);
  error = signal('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.employeeService.reservations().subscribe((d) => {
      this.reservations.set(d.reservations);
      this.trainings.set(d.trainings);
    });
  }

  /** Confirm/No-show available only up to 10 min after start. */
  inWindow(start: string): boolean {
    const diffMin = (Date.now() - new Date(start).getTime()) / 60000;
    return diffMin >= 0 && diffMin <= 10;
  }

  resourceName(r: any): string {
    const res = r.facility?.resources?.find((x: any) => String(x._id) === String(r.resourceId));
    return res?.name || '';
  }

  confirm(r: any): void {
    this.employeeService.confirm(r._id).subscribe({ next: () => this.load(), error: (e) => this.error.set(e?.error?.message) });
  }
  noShow(r: any): void {
    this.employeeService.noShow(r._id).subscribe({ next: () => this.load(), error: (e) => this.error.set(e?.error?.message) });
  }
}
