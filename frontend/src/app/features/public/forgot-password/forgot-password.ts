import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../../core/auth-api.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <form class="card auth-card" [formGroup]="form" (ngSubmit)="submit()">
        <h1>Zaboravljena lozinka</h1>
        <p class="muted">Unesite korisničko ime ili e-mejl. Poslaćemo vam link za resetovanje (važi 30 minuta).</p>

        @if (message()) {
          <div class="alert alert-success">{{ message() }}</div>
        }

        <div class="form-group">
          <label for="identifier">Korisničko ime ili e-mejl</label>
          <input id="identifier" type="text" formControlName="identifier" />
          @if (form.controls.identifier.touched && form.controls.identifier.invalid) {
            <div class="field-error">Ovo polje je obavezno.</div>
          }
        </div>

        <button class="btn" type="submit" [disabled]="loading()">Pošalji link</button>
        <div class="auth-links"><a routerLink="/login">Nazad na prijavu</a></div>
      </form>
    </div>
  `,
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private api = inject(AuthApiService);

  message = signal('');
  loading = signal(false);

  form = this.fb.nonNullable.group({
    identifier: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.api.forgotPassword(this.form.getRawValue().identifier).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.message.set(res.message);
      },
      error: () => {
        this.loading.set(false);
        this.message.set('Ako nalog postoji, poslat je link za resetovanje lozinke.');
      },
    });
  }
}
