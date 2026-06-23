import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

/**
 * Administrator login. Reachable only via the hidden route (not linked from the
 * home page or main menu). Same fields as the public login.
 */
@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="auth-wrap">
      <form class="card auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Administrator</h1>
        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        <div class="form-group">
          <label for="username">Korisničko ime</label>
          <input id="username" type="text" formControlName="username" />
        </div>
        <div class="form-group">
          <label for="password">Lozinka</label>
          <input id="password" type="password" formControlName="password" />
        </div>
        <button class="btn" type="submit" [disabled]="loading()">Prijavi se</button>
      </form>
    </div>
  `,
})
export class AdminLogin {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = signal('');
  loading = signal(false);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.auth.adminLogin(username, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Prijava nije uspela.');
      },
    });
  }
}
