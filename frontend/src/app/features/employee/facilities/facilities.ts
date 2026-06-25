import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/employee.service';
import { SportService } from '../../../core/sport.service';
import { Facility, FacilityResource, Sport } from '../../../core/models';
import { UPLOADS_BASE } from '../../../core/config';

const NEW_FACILITY = () => ({
  name: '', city: '', address: '', maticniBroj: '', pib: '',
  pricePerHour: 1500, maxNoShows: 3,
  workingHours: { open: '08:00', close: '22:00' }, sports: [] as string[],
});

@Component({
  selector: 'app-employee-facilities',
  imports: [FormsModule],
  templateUrl: './facilities.html',
})
export class EmployeeFacilities implements OnInit {
  private employeeService = inject(EmployeeService);
  private sportService = inject(SportService);

  uploads = UPLOADS_BASE;
  facilities = signal<Facility[]>([]);
  sports = signal<Sport[]>([]);
  message = signal('');
  error = signal('');

  newFacility: any = NEW_FACILITY();
  newImages: File[] = [];
  newResource: Record<string, any> = {};
  editFacility: Record<string, any> = {}; // facilityId -> edit model (absent = not editing)
  editResource: Record<string, any> = {}; // resourceId -> edit model

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.load();
  }

  load(): void {
    this.employeeService.facilities().subscribe((f) => this.facilities.set(f));
  }

  imgUrl(img: string): string {
    return this.uploads + '/' + img.replace('/uploads/', '');
  }

  // ---------- Create ----------
  toggleSport(name: string): void {
    const arr = this.newFacility.sports as string[];
    this.newFacility.sports = arr.includes(name) ? arr.filter((s) => s !== name) : [...arr, name];
  }

  onNewImages(e: Event): void {
    this.newImages = Array.from((e.target as HTMLInputElement).files ?? []);
  }

  create(): void {
    this.employeeService.createFacility(this.newFacility).subscribe({
      next: (created) => {
        const done = () => {
          this.message.set('Objekat kreiran (čeka odobrenje administratora).');
          this.error.set('');
          this.newFacility = NEW_FACILITY();
          this.newImages = [];
          this.load();
        };
        if (this.newImages.length) {
          this.employeeService.uploadFacilityImages(created._id, this.newImages).subscribe({
            next: done,
            error: (err) => this.error.set(err?.error?.message || 'Greška pri otpremanju slika.'),
          });
        } else done();
      },
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

  // ---------- Edit facility ----------
  startEditFacility(f: Facility): void {
    this.editFacility[f._id] = {
      name: f.name,
      city: f.city,
      address: f.address,
      pricePerHour: f.pricePerHour,
      maxNoShows: f.maxNoShows,
      workingHours: { open: f.workingHours.open, close: f.workingHours.close },
      description: f.description || '',
      sports: [...((f.sports as string[]) || [])],
    };
  }
  cancelEditFacility(id: string): void {
    delete this.editFacility[id];
  }
  toggleEditSport(id: string, name: string): void {
    const m = this.editFacility[id];
    m.sports = m.sports.includes(name) ? m.sports.filter((s: string) => s !== name) : [...m.sports, name];
  }
  saveFacility(f: Facility): void {
    this.employeeService.updateFacility(f._id, this.editFacility[f._id]).subscribe({
      next: () => { this.cancelEditFacility(f._id); this.message.set('Objekat je ažuriran.'); this.error.set(''); this.load(); },
      error: (err) => this.error.set(err?.error?.message || 'Greška.'),
    });
  }

  // ---------- Edit resource ----------
  startEditResource(r: FacilityResource): void {
    this.editResource[r._id] = {
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      equipmentDescription: r.equipmentDescription || '',
      sport: r.sport,
    };
  }
  cancelEditResource(id: string): void {
    delete this.editResource[id];
  }
  saveResource(f: Facility, r: FacilityResource): void {
    this.employeeService.updateResource(f._id, r._id, this.editResource[r._id]).subscribe({
      next: () => { this.cancelEditResource(r._id); this.message.set('Teren/hala je ažuriran.'); this.error.set(''); this.load(); },
      error: (err) => this.error.set(err?.error?.message || 'Greška.'),
    });
  }

  // ---------- Add resource ----------
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

  // ---------- Images on existing facility ----------
  onAddImages(f: Facility, e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    this.employeeService.uploadFacilityImages(f._id, files).subscribe({
      next: () => { this.error.set(''); this.load(); },
      error: (err) => this.error.set(err?.error?.message || 'Greška pri otpremanju.'),
    });
  }
  removeImage(f: Facility, img: string): void {
    this.employeeService.removeFacilityImage(f._id, img).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.message || 'Greška.'),
    });
  }
}
