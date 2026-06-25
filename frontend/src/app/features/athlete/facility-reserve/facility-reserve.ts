import { Component, ElementRef, OnInit, effect, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { FacilityService, FacilityDetails } from '../../../core/facility.service';
import { ReservationService } from '../../../core/reservation.service';
import { ReviewService } from '../../../core/review.service';
import { AuthService } from '../../../core/auth.service';
import { WeeklyCalendar } from '../../../shared/weekly-calendar/weekly-calendar';
import { UPLOADS_BASE } from '../../../core/config';

const CITY_COORDS: Record<string, [number, number]> = {
  Beograd: [44.7866, 20.4489],
  'Novi Sad': [45.2671, 19.8335],
  Niš: [43.3209, 21.8958],
  Kragujevac: [44.0142, 20.9394],
};

@Component({
  selector: 'app-facility-reserve',
  imports: [WeeklyCalendar, DatePipe, FormsModule],
  templateUrl: './facility-reserve.html',
})
export class FacilityReserve implements OnInit {
  private route = inject(ActivatedRoute);
  private facilityService = inject(FacilityService);
  private reservationService = inject(ReservationService);
  private reviewService = inject(ReviewService);
  private auth = inject(AuthService);

  myUsername = this.auth.user()?.username;
  uploads = UPLOADS_BASE;
  facility = signal<FacilityDetails | null>(null);
  private mapEl = viewChild<ElementRef<HTMLElement>>('mapEl');

  imgUrl(img: string): string {
    return this.uploads + '/' + img.replace('/uploads/', '');
  }

  constructor() {
    // Initialize the map only once both the data and the (conditionally
    // rendered) container element are available.
    effect(() => {
      const host = this.mapEl();
      const f = this.facility();
      if (host && f && !this.map) this.initMap(host.nativeElement, f);
    });
  }
  resourceIndex = signal(0);
  selectedSlot = signal<Date | null>(null);
  duration = 1;
  message = signal('');
  error = signal('');

  reviewComment = '';
  reviewReaction: 'like' | 'dislike' = 'like';

  typeLabel: Record<string, string> = { open: 'Otvoreni teren', closed: 'Zatvoreni teren', hall: 'Dvorana' };
  private map?: L.Map;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.facilityService.details(id).subscribe((f) => this.facility.set(f));
  }

  get currentResource() {
    return this.facility()?.resources[this.resourceIndex()];
  }
  get openHour(): number {
    return Number(this.facility()?.workingHours.open.split(':')[0] ?? 8);
  }
  get closeHour(): number {
    return Number(this.facility()?.workingHours.close.split(':')[0] ?? 22);
  }

  rotate(delta: number): void {
    const len = this.facility()?.resources.length || 1;
    this.resourceIndex.set((this.resourceIndex() + delta + len) % len);
    this.selectedSlot.set(null);
  }

  onSlot(d: Date): void {
    this.selectedSlot.set(d);
    this.message.set('');
    this.error.set('');
  }

  reserve(): void {
    const f = this.facility();
    const r = this.currentResource;
    const slot = this.selectedSlot();
    if (!f || !r || !slot) return;
    this.reservationService
      .create({
        facility: f._id,
        resourceId: r._id,
        sport: typeof r.sport === 'string' ? r.sport : (r.sport as any)._id,
        start: slot.toISOString(),
        durationHours: this.duration,
      })
      .subscribe({
        next: () => {
          this.message.set('Rezervacija je kreirana (čeka potvrdu zaposlenog).');
          this.selectedSlot.set(null);
          this.reload();
        },
        error: (err) => this.error.set(err?.error?.message || 'Rezervacija nije uspela.'),
      });
  }

  submitReview(): void {
    const f = this.facility();
    if (!f) return;
    this.reviewService.create(f._id, this.reviewReaction, this.reviewComment).subscribe({
      next: () => {
        this.message.set('Hvala na oceni!');
        this.reviewComment = '';
        this.reload();
      },
      error: (err) => this.error.set(err?.error?.message || 'Ocenjivanje nije uspelo.'),
    });
  }

  private reload(): void {
    const id = this.facility()!._id;
    this.facilityService.details(id).subscribe((f) => this.facility.set(f));
  }

  private initMap(el: HTMLElement, f: FacilityDetails): void {
    if (this.map) return;
    const coords: [number, number] = f.location
      ? [f.location.lat, f.location.lng]
      : CITY_COORDS[f.city] || [44.0, 20.9];
    this.map = L.map(el).setView(coords, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);
    const icon = L.divIcon({ html: '📍', className: 'map-pin', iconSize: [24, 24] });
    L.marker(coords, { icon }).addTo(this.map).bindPopup(`${f.name}<br>${f.address}`);
    // Container size isn't final on first paint inside the @if block.
    setTimeout(() => this.map?.invalidateSize(), 0);
  }
}
