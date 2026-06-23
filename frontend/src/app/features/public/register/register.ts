import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { createAvatar } from '@dicebear/core';
import { funEmoji, adventurer, bottts, micah } from '@dicebear/collection';
import { AuthApiService } from '../../../core/auth-api.service';
import { SportService } from '../../../core/sport.service';
import { Sport } from '../../../core/models';
import {
  maticniBrojValidator,
  passwordValidator,
  pibValidator,
} from '../../../core/validators';

const AVATAR_STYLES = [funEmoji, adventurer, bottts, micah];

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(AuthApiService);
  private sportService = inject(SportService);
  private router = inject(Router);

  sports = signal<Sport[]>([]);
  selectedSports = signal<string[]>([]);
  error = signal('');
  success = signal('');
  loading = signal(false);

  /** Image chosen via upload OR generated avatar; sent as a file to the server. */
  imageBlob: Blob | null = null;
  imagePreview = signal<string>('');
  avatarSvg = signal<string>('');

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, passwordValidator]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['athlete', Validators.required],
    // Employee-only
    facilityName: [''],
    address: [''],
    city: [''],
    maticniBroj: ['', maticniBrojValidator],
    pib: ['', pibValidator],
  });

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.form.controls.role.valueChanges.subscribe((role) => this.applyEmployeeValidators(role));
  }

  get isEmployee(): boolean {
    return this.form.controls.role.value === 'employee';
  }

  private applyEmployeeValidators(role: string): void {
    const c = this.form.controls;
    const required = role === 'employee';
    const set = (ctrl: typeof c.facilityName, validators: any[]) => {
      ctrl.setValidators(validators);
      ctrl.updateValueAndValidity();
    };
    set(c.facilityName, required ? [Validators.required] : []);
    set(c.address, required ? [Validators.required] : []);
    set(c.maticniBroj, required ? [Validators.required, maticniBrojValidator] : [maticniBrojValidator]);
    set(c.pib, required ? [Validators.required, pibValidator] : [pibValidator]);
  }

  toggleSport(id: string): void {
    const cur = this.selectedSports();
    if (cur.includes(id)) {
      this.selectedSports.set(cur.filter((s) => s !== id));
    } else if (cur.length < 5) {
      this.selectedSports.set([...cur, id]);
    }
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.imageBlob = file;
    this.avatarSvg.set('');
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  generateAvatar(): void {
    const style = AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)];
    const seed = Math.random().toString(36).slice(2);
    const svg = createAvatar(style as any, { seed, size: 160 }).toString();
    this.avatarSvg.set(svg);
    this.imagePreview.set('data:image/svg+xml;utf8,' + encodeURIComponent(svg));
    this.imageBlob = null; // converted to PNG only when saved
  }

  /** Converts the generated SVG avatar to a PNG blob and marks it as the chosen image. */
  async saveAvatarAsImage(): Promise<void> {
    const svg = this.avatarSvg();
    if (!svg) return;
    this.imageBlob = await svgToPng(svg, 160);
    this.imagePreview.set(URL.createObjectURL(this.imageBlob));
    this.avatarSvg.set('');
    this.success.set('Avatar je sačuvan kao profilna slika.');
  }

  submit(): void {
    this.applyEmployeeValidators(this.form.controls.role.value);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const fd = new FormData();
    const v = this.form.getRawValue();
    Object.entries(v).forEach(([k, val]) => fd.append(k, val as string));
    fd.set('sports', JSON.stringify(this.selectedSports()));
    if (this.imageBlob) {
      const name = this.imageBlob instanceof File ? this.imageBlob.name : 'avatar.png';
      fd.append('profileImage', this.imageBlob, name);
    }

    this.loading.set(true);
    this.error.set('');
    this.api.register(fd).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set(res.message);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err?.error?.errors?.[0]?.message || err?.error?.message || 'Registracija nije uspela.'
        );
      },
    });
  }
}

/** Renders an SVG string to a PNG Blob via an offscreen canvas. */
function svgToPng(svg: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
    };
    img.onerror = reject;
    img.src = url;
  });
}
