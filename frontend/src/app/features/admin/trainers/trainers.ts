import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/admin.service';
import { Trainer } from '../../../core/models';

@Component({
  selector: 'app-admin-trainers',
  template: `
    <h1>Evidencija trenera</h1>
    <section class="card">
      @if (trainers().length) {
        <table class="table">
          <thead><tr><th>Ime</th><th>Specijalizacija</th><th>Objekat</th><th>Sport</th><th>Status</th><th>Akcije</th></tr></thead>
          <tbody>
            @for (t of trainers(); track t._id) {
              <tr>
                <td>{{ t.name }}</td>
                <td>{{ t.specialization }}</td>
                <td>{{ $any(t.facility).name }}</td>
                <td>{{ t.sport }}</td>
                <td><span class="badge badge-{{ t.active ? 'confirmed' : 'cancelled' }}">{{ t.active ? 'aktivan' : 'neaktivan' }}</span></td>
                <td>
                  @if (t.active) { <button class="btn btn-sm btn-danger" (click)="toggle(t, false)">Deaktiviraj</button> }
                  @else { <button class="btn btn-sm btn-success" (click)="toggle(t, true)">Aktiviraj</button> }
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else { <p class="muted">Nema trenera.</p> }
    </section>
  `,
})
export class AdminTrainers implements OnInit {
  private adminService = inject(AdminService);
  trainers = signal<Trainer[]>([]);

  ngOnInit(): void { this.load(); }
  load(): void { this.adminService.trainers().subscribe((t) => this.trainers.set(t)); }
  toggle(t: Trainer, active: boolean): void {
    this.adminService.setTrainerActive(t._id, active).subscribe(() => this.load());
  }
}
