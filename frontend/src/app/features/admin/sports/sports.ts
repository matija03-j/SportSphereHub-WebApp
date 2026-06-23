import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SportService } from '../../../core/sport.service';
import { Sport } from '../../../core/models';

@Component({
  selector: 'app-admin-sports',
  imports: [FormsModule],
  template: `
    <h1>Vrste sportova</h1>
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    <section class="card">
      <div class="row" style="align-items:flex-end">
        <div class="form-group"><label>Novi sport</label><input [(ngModel)]="name" /></div>
        <button class="btn" (click)="add()">Dodaj</button>
      </div>
      <ul>
        @for (s of sports(); track s._id) { <li>{{ s.name }}</li> }
      </ul>
    </section>
  `,
})
export class AdminSports implements OnInit {
  private sportService = inject(SportService);
  sports = signal<Sport[]>([]);
  name = '';
  error = signal('');

  ngOnInit(): void { this.load(); }
  load(): void { this.sportService.list().subscribe((s) => this.sports.set(s)); }
  add(): void {
    if (!this.name.trim()) return;
    this.sportService.create(this.name.trim()).subscribe({
      next: () => { this.name = ''; this.error.set(''); this.load(); },
      error: (e) => this.error.set(e?.error?.message || 'Greška (možda već postoji).'),
    });
  }
}
