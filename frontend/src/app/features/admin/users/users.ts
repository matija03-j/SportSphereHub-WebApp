import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/admin.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule],
  templateUrl: './users.html',
})
export class AdminUsers implements OnInit {
  private adminService = inject(AdminService);
  users = signal<User[]>([]);
  roleFilter = '';
  editing = signal<string | null>(null);
  draft: any = {};

  ngOnInit(): void { this.load(); }

  load(): void {
    this.adminService.users(this.roleFilter || undefined).subscribe((u) => this.users.set(u));
  }

  edit(u: User): void {
    this.editing.set(u._id);
    this.draft = { firstName: u.firstName, lastName: u.lastName, phone: u.phone, email: u.email, status: u.status };
  }
  save(u: User): void {
    this.adminService.updateUser(u._id, this.draft).subscribe(() => { this.editing.set(null); this.load(); });
  }
  remove(u: User): void {
    if (confirm(`Obrisati korisnika ${u.username}?`)) {
      this.adminService.deleteUser(u._id).subscribe(() => this.load());
    }
  }
}
