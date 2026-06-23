import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/employee.service';
import { SportService } from '../../../core/sport.service';
import { Facility, Sport } from '../../../core/models';

@Component({
  selector: 'app-employee-facilities',
  imports: [FormsModule],
  templateUrl: './facilities.html',
})
export class EmployeeFacilities implements OnInit {
  private employeeService = inject(EmployeeService);
  private sportService = inject(SportService);

  facilities = signal<Facility[]>([]);
  sports = signal<Sport[]>([]);
  message = signal('');
  error = signal('');

  newFacility: any = {
    name: '', city: '', address: '', maticniBroj: '', pib: '',
    pricePerHour: 1500, maxNoShows: 3,
    workingHours: { open: '08:00', close: '22:00' }, sports: [],
  };

  newResource: Record<string, any> = {};

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.load();
  }

  load(): void {
    this.employeeService.facilities().subscribe((f) => this.facilities.set(f));
  }

  toggleSport(id: string): void {
    const arr = this.newFacility.sports as string[];
    this.newFacility.sports = arr.includes(id) ? arr.filter((s) => s !== id) : [...arr, id];
  }

  create(): void {
    this.employeeService.createFacility(this.newFacility).subscribe({
      next: () => { this.message.set('Objekat kreiran (čeka odobrenje administratora).'); this.error.set(''); this.load(); },
      error: (err) => this.error.set(err?.error?.message || 'Greška.'),
    });
  }

  onJson(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.employeeService.createFacilityFromJson(file).subscribe({
      next: () => { this.message.set('Objekat iz JSON-a kreiran (čeka odobrenje).'); this.error.set(''); this.load(); },
      error: (err) => this.error.set(err?.error?.message || 'Neispravan JSON.'),
    });
  }

  addResource(f: Facility): void {
    const r = this.newResource[f._id];
    if (!r?.name || !r?.type || !r?.sport) { this.error.set('Popunite podatke o terenu.'); return; }
    this.employeeService.addResource(f._id, r).subscribe({
      next: () => { this.newResource[f._id] = {}; this.error.set(''); this.load(); },
      error: (err) => this.error.set(err?.error?.message || 'Greška.'),
    });
  }

  ensureResource(id: string): any {
    if (!this.newResource[id]) this.newResource[id] = { type: 'open', capacity: 4 };
    return this.newResource[id];
  }
}
