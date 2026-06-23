import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/employee.service';
import { SportService } from '../../../core/sport.service';
import { Facility, Promotion, Sport } from '../../../core/models';

@Component({
  selector: 'app-employee-promotions',
  imports: [DatePipe, FormsModule],
  templateUrl: './promotions.html',
})
export class EmployeePromotions implements OnInit {
  private employeeService = inject(EmployeeService);
  private sportService = inject(SportService);

  promotions = signal<Promotion[]>([]);
  facilities = signal<Facility[]>([]);
  sports = signal<Sport[]>([]);
  error = signal('');

  form: any = { name: '', facility: '', startDate: '', endDate: '', discountType: 'percent', value: 10, sport: '' };

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.employeeService.facilities().subscribe((f) => this.facilities.set(f));
    this.load();
  }

  load(): void {
    this.employeeService.promotions().subscribe((p) => this.promotions.set(p));
  }

  create(): void {
    this.employeeService.createPromotion(this.form).subscribe({
      next: () => { this.load(); this.error.set(''); },
      error: (e) => this.error.set(e?.error?.message || 'Greška.'),
    });
  }

  remove(p: Promotion): void {
    this.employeeService.deletePromotion(p._id).subscribe(() => this.load());
  }
}
