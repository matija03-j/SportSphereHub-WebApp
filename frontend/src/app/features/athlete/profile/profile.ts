import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { UserService } from '../../../core/user.service';
import { SportService } from '../../../core/sport.service';
import { AuthService } from '../../../core/auth.service';
import { Sport, User } from '../../../core/models';
import { UPLOADS_BASE } from '../../../core/config';
import { AthleteReservations } from '../reservations/reservations';

@Component({
  selector: 'app-athlete-profile',
  imports: [ReactiveFormsModule, AthleteReservations],
  templateUrl: './profile.html',
})
export class AthleteProfile implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private sportService = inject(SportService);
  private auth = inject(AuthService);

  uploads = UPLOADS_BASE;
  user = signal<User | null>(null);
  sports = signal<Sport[]>([]);
  selectedSports = signal<string[]>([]);
  message = signal('');
  error = signal('');
  imageFile: File | null = null;

  form = this.fb.nonNullable.group({
    firstName: [''],
    lastName: [''],
    phone: [''],
    email: [''],
  });

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.userService.me().subscribe((u) => {
      this.user.set(u);
      this.form.patchValue(u);
      this.selectedSports.set(u.sports as string[]);
    });
  }

  toggleSport(name: string): void {
    const cur = this.selectedSports();
    if (cur.includes(name)) this.selectedSports.set(cur.filter((s) => s !== name));
    else if (cur.length < 5) this.selectedSports.set([...cur, name]);
  }

  onFile(e: Event): void {
    this.imageFile = (e.target as HTMLInputElement).files?.[0] || null;
  }

  save(): void {
    const fd = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([k, v]) => fd.append(k, v));
    fd.set('sports', JSON.stringify(this.selectedSports()));
    if (this.imageFile) fd.append('profileImage', this.imageFile);
    this.userService.updateMe(fd).subscribe({
      next: (u) => {
        this.user.set(u);
        this.auth.setUser(u);
        this.message.set('Profil je sačuvan.');
        this.error.set('');
      },
      error: (err) => this.error.set(err?.error?.message || 'Greška pri čuvanju.'),
    });
  }
}
