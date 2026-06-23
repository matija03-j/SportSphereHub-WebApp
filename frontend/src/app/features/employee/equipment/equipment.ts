import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/employee.service';
import { SportService } from '../../../core/sport.service';
import { Equipment, Facility, Order, Sport } from '../../../core/models';

@Component({
  selector: 'app-employee-equipment',
  imports: [DatePipe, FormsModule],
  templateUrl: './equipment.html',
})
export class EmployeeEquipment implements OnInit {
  private employeeService = inject(EmployeeService);
  private sportService = inject(SportService);

  equipment = signal<Equipment[]>([]);
  orders = signal<Order[]>([]);
  facilities = signal<Facility[]>([]);
  sports = signal<Sport[]>([]);
  error = signal('');

  form: any = { name: '', sport: '', price: 1000, stock: 10, facility: '' };
  imageFile: File | null = null;

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.employeeService.facilities().subscribe((f) => this.facilities.set(f));
    this.load();
  }

  load(): void {
    this.employeeService.equipment().subscribe((e) => this.equipment.set(e));
    this.employeeService.orders().subscribe((o) => this.orders.set(o));
  }

  onFile(e: Event): void {
    this.imageFile = (e.target as HTMLInputElement).files?.[0] || null;
  }

  create(): void {
    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => fd.append(k, String(v)));
    if (this.imageFile) fd.append('image', this.imageFile);
    this.employeeService.createEquipment(fd).subscribe({
      next: () => { this.load(); this.error.set(''); },
      error: (e) => this.error.set(e?.error?.message || 'Greška.'),
    });
  }

  updateStock(eq: Equipment, stock: number, price: number): void {
    const fd = new FormData();
    fd.append('stock', String(stock));
    fd.append('price', String(price));
    this.employeeService.updateEquipment(eq._id, fd).subscribe(() => this.load());
  }

  setStatus(o: Order, status: string): void {
    this.employeeService.updateOrderStatus(o._id, status).subscribe(() => this.load());
  }
}
