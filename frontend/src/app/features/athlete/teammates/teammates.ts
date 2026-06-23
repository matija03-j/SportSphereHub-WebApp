import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TeammateService } from '../../../core/teammate.service';
import { SportService } from '../../../core/sport.service';
import { AuthService } from '../../../core/auth.service';
import { Sport, TeammateAd } from '../../../core/models';

@Component({
  selector: 'app-teammates',
  imports: [ReactiveFormsModule],
  templateUrl: './teammates.html',
})
export class Teammates implements OnInit {
  private fb = inject(FormBuilder);
  private teammateService = inject(TeammateService);
  private sportService = inject(SportService);
  private auth = inject(AuthService);

  ads = signal<TeammateAd[]>([]);
  mine = signal<TeammateAd[]>([]);
  sports = signal<Sport[]>([]);
  message = signal('');
  error = signal('');
  myUsername = this.auth.user()?.username;

  form = this.fb.nonNullable.group({
    sport: ['', Validators.required],
    city: ['', Validators.required],
    date: ['', Validators.required],
    timeFrom: ['18:00', Validators.required],
    timeTo: ['19:00', Validators.required],
    neededPlayers: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.reload();
  }

  reload(): void {
    this.teammateService.list().subscribe((a) => this.ads.set(a));
    this.teammateService.mine().subscribe((a) => this.mine.set(a));
  }

  alreadyRequested(ad: TeammateAd): boolean {
    return ad.joinRequests.some((r) => (typeof r.user === 'string' ? r.user : r.user.username) === this.myUsername);
  }
  isMine(ad: TeammateAd): boolean {
    return (typeof ad.author === 'string' ? ad.author : ad.author.username) === this.myUsername;
  }

  create(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.teammateService.create(this.form.getRawValue() as any).subscribe({
      next: () => { this.message.set('Oglas je objavljen.'); this.form.reset({ timeFrom: '18:00', timeTo: '19:00', neededPlayers: 1 }); this.reload(); },
      error: (err) => this.error.set(err?.error?.message || 'Greška.'),
    });
  }

  join(ad: TeammateAd): void {
    this.teammateService.join(ad._id).subscribe({
      next: () => { this.message.set('Zahtev poslat.'); this.reload(); },
      error: (err) => this.error.set(err?.error?.message || 'Greška.'),
    });
  }

  decide(ad: TeammateAd, reqId: string, decision: 'approved' | 'rejected'): void {
    this.teammateService.decide(ad._id, reqId, decision).subscribe(() => this.reload());
  }

  close(ad: TeammateAd): void {
    this.teammateService.close(ad._id).subscribe(() => this.reload());
  }
}
