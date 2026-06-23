import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/auth-api.service';
import { passwordValidator } from '../../../core/validators';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <form class="card auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Nova lozinka</h1>

        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        @if (success()) {
          <div class="alert alert-success">{{ success() }}</div>
          <div class="auth-links"><a routerLink="/login">Prijavite se</a></div>
        } @else {
          <div class="form-group">
            <label for="password">Lozinka</label>
            <input id="password" type="password" formControlName="password" />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <div class="field-error">
                8–12 karaktera, počinje slovom, sadrži veliko slovo, broj i specijalni karakter.
              </div>
            }
          </div>
          <button class="btn" type="submit" [disabled]="loading() || !token">Sačuvaj</button>
          @if (!token) { <p class="field-error">Nedostaje token za resetovanje.</p> }
        }
      </form>
    </div>
  `,
})
export class ResetPassword {
  private fb = inject(FormBuilder);
  private api = inject(AuthApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  token = this.route.snapshot.queryParamMap.get('token') || '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, passwordValidator]],
  });

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.resetPassword(this.token, this.form.getRawValue().password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res.message);
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Resetovanje nije uspelo.');
      },
    });
  }
}
