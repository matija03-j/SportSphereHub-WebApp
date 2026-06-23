import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReservationService, MyReservation } from '../../../core/reservation.service';

type SortKey = 'facilityName' | 'city' | 'resourceName' | 'sportName' | 'start' | 'status';

@Component({
  selector: 'app-athlete-reservations',
  imports: [DatePipe],
  templateUrl: './reservations.html',
})
export class AthleteReservations implements OnInit {
  private reservationService = inject(ReservationService);

  reservations = signal<MyReservation[]>([]);
  error = signal('');
  sortKey = signal<SortKey>('start');
  sortAsc = signal(false);

  sortedReservations = computed(() => {
    const key = this.sortKey();
    const asc = this.sortAsc();
    return [...this.reservations()].sort((a, b) => {
      const av = (a as any)[key] ?? '';
      const bv = (b as any)[key] ?? '';
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.reservationService.mine().subscribe((r) => this.reservations.set(r));
  }

  canCancel(r: MyReservation): boolean {
    if (['cancelled', 'completed', 'no_show'].includes(r.status)) return false;
    return (new Date(r.start).getTime() - Date.now()) / 3600000 >= 12;
  }

  cancel(r: MyReservation): void {
    this.reservationService.cancel(r._id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err?.error?.message || 'Otkazivanje nije uspelo.'),
    });
  }

  setSort(key: SortKey): void {
    if (this.sortKey() === key) this.sortAsc.set(!this.sortAsc());
    else { this.sortKey.set(key); this.sortAsc.set(true); }
  }
  arrow(key: SortKey): string {
    return this.sortKey() !== key ? '↕' : this.sortAsc() ? '↑' : '↓';
  }
}
