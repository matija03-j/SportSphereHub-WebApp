import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/admin.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-admin-requests',
  template: `
    <h1>Zahtevi za registraciju</h1>
    <section class="card">
      @if (requests().length) {
        <table class="table">
          <thead><tr><th>Korisnik</th><th>Ime</th><th>Email</th><th>Uloga</th><th>Akcije</th></tr></thead>
          <tbody>
            @for (u of requests(); track u._id) {
              <tr>
                <td>{{ u.username }}</td>
                <td>{{ u.firstName }} {{ u.lastName }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.role }}</td>
                <td>
                  <button class="btn btn-sm btn-success" (click)="decide(u, 'approved')">Odobri</button>
                  <button class="btn btn-sm btn-danger" (click)="decide(u, 'rejected')">Odbij</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      } @else { <p class="muted">Nema zahteva na čekanju.</p> }
    </section>
  `,
})
export class AdminRequests implements OnInit {
  private adminService = inject(AdminService);
  requests = signal<User[]>([]);

  ngOnInit(): void { this.load(); }
  load(): void { this.adminService.requests().subscribe((r) => this.requests.set(r)); }
  decide(u: User, decision: 'approved' | 'rejected'): void {
    this.adminService.decideRequest(u._id, decision).subscribe(() => this.load());
  }
}
