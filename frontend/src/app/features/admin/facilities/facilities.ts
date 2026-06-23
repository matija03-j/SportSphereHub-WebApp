import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/admin.service';
import { Facility } from '../../../core/models';

@Component({
  selector: 'app-admin-facilities',
  template: `
    <h1>Odobravanje objekata</h1>
    <section class="card">
      @if (facilities().length) {
        <table class="table">
          <thead><tr><th>Naziv</th><th>Grad</th><th>Adresa</th><th>Matični / PIB</th><th>Zaposleni</th><th>Akcije</th></tr></thead>
          <tbody>
            @for (f of facilities(); track f._id) {
              <tr>
                <td>{{ f.name }}</td>
                <td>{{ f.city }}</td>
                <td>{{ f.address }}</td>
                <td>{{ f.maticniBroj }} / {{ f.pib }}</td>
                <td>@for (e of $any(f.employees); track e._id) { <div>{{ e.firstName }} {{ e.lastName }}</div> }</td>
                <td>
                  <button class="btn btn-sm btn-success" (click)="decide(f, 'approved')">Odobri</button>
                  <button class="btn btn-sm btn-danger" (click)="decide(f, 'rejected')">Odbij</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else { <p class="muted">Nema objekata na čekanju.</p> }
    </section>
  `,
})
export class AdminFacilities implements OnInit {
  private adminService = inject(AdminService);
  facilities = signal<Facility[]>([]);

  ngOnInit(): void { this.load(); }
  load(): void { this.adminService.pendingFacilities().subscribe((f) => this.facilities.set(f)); }
  decide(f: Facility, decision: 'approved' | 'rejected'): void {
    this.adminService.decideFacility(f._id, decision).subscribe(() => this.load());
  }
}
