import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { EmployeeService } from '../../../core/employee.service';
import { AuthService } from '../../../core/auth.service';
import { Facility, User } from '../../../core/models';
import { UPLOADS_BASE } from '../../../core/config';

@Component({
  selector: 'app-employee-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class EmployeeProfile implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private employeeService = inject(EmployeeService);
  private auth = inject(AuthService);

  uploads = UPLOADS_BASE;
  user = signal<User | null>(null);
  facilities = signal<Facility[]>([]);
  message = signal('');
  imageFile: File | null = null;

  form = this.fb.nonNullable.group({ firstName: [''], lastName: [''], phone: [''], email: [''] });

  ngOnInit(): void {
    this.userService.me().subscribe((u) => { this.user.set(u); this.form.patchValue(u); });
    this.employeeService.facilities().subscribe((f) => this.facilities.set(f));
  }

  onFile(e: Event): void {
    this.imageFile = (e.target as HTMLInputElement).files?.[0] || null;
  }

  save(): void {
    const fd = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([k, v]) => fd.append(k, v));
    if (this.imageFile) fd.append('profileImage', this.imageFile);
    this.userService.updateMe(fd).subscribe((u) => {
      this.user.set(u);
      this.auth.setUser(u);
      this.message.set('Profil je sačuvan.');
    });
  }

  sportNames(f: Facility): string {
    return (f.sports as any[]).map((s) => (typeof s === 'string' ? s : s.name)).join(', ');
  }
}
