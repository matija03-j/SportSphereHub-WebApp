import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/employee.service';
import { SportService } from '../../../core/sport.service';
import { Facility, Promotion, Sport } from '../../../core/models';

const EMPTY_FORM = () => ({
  name: '',
  facility: '',
  startDate: '',
  endDate: '',
  discountType: 'percent',
  value: 10,
  sport: '',
});

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
  editingId = signal<string | null>(null);

  form: any = EMPTY_FORM();

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.employeeService.facilities().subscribe((f) => this.facilities.set(f));
    this.load();
  }

  load(): void {
    this.employeeService.promotions().subscribe((p) => this.promotions.set(p));
  }

  edit(p: Promotion): void {
    this.editingId.set(p._id);
    this.error.set('');
    this.form = {
      name: p.name,
      facility: typeof p.facility === 'string' ? p.facility : (p.facility as any)?._id,
      startDate: (p.startDate || '').slice(0, 10),
      endDate: (p.endDate || '').slice(0, 10),
      discountType: p.discountType,
      value: p.value,
      sport: typeof p.sport === 'string' ? p.sport : ((p.sport as any)?.name ?? ''),
    };
  }

  save(): void {
    const id = this.editingId();
    const obs = id
      ? this.employeeService.updatePromotion(id, this.form)
      : this.employeeService.createPromotion(this.form);
    obs.subscribe({
      next: () => {
        this.resetForm();
        this.load();
      },
      error: (e) => this.error.set(e?.error?.message || 'Greška.'),
    });
  }

  resetForm(): void {
    this.form = EMPTY_FORM();
    this.editingId.set(null);
    this.error.set('');
  }

  remove(p: Promotion): void {
    this.employeeService.deletePromotion(p._id).subscribe(() => {
      if (this.editingId() === p._id) this.resetForm();
      this.load();
    });
  }
}
