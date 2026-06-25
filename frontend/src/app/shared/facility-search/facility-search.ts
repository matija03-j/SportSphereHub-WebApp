import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacilityService, FacilitySearchResult } from '../../core/facility.service';
import { SportService } from '../../core/sport.service';
import { Sport } from '../../core/models';

type SortKey = 'name' | 'city' | 'sport';

@Component({
  selector: 'app-facility-search',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './facility-search.html',
})
export class FacilitySearch implements OnInit {
  /** When true, shows the athlete-only "samo slobodni termini danas" checkbox. */
  @Input() showTodayFilter = false;
  /** Base path for the Details button (public vs athlete reservation view). */
  @Input() detailsBase = '/facility';

  private fb = inject(FormBuilder);
  private facilityService = inject(FacilityService);
  private sportService = inject(SportService);

  sports = signal<Sport[]>([]);
  cities = signal<string[]>([]);
  selectedCities = signal<string[]>([]);
  results = signal<FacilitySearchResult[]>([]);
  searched = signal(false);

  sortKey = signal<SortKey>('name');
  sortAsc = signal(true);

  form = this.fb.nonNullable.group({
    name: [''],
    sport: [''],
    type: [''],
    onlyFreeToday: [false],
  });

  sorted = computed(() => {
    const key = this.sortKey();
    const asc = this.sortAsc();
    const cityFilter = this.selectedCities();
    let rows = this.results();
    if (cityFilter.length) rows = rows.filter((r) => cityFilter.includes(r.city));
    return [...rows].sort((a, b) => {
      const av = key === 'sport' ? a.sportNames.join(', ') : (a as any)[key];
      const bv = key === 'sport' ? b.sportNames.join(', ') : (b as any)[key];
      return asc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  });

  ngOnInit(): void {
    this.sportService.list().subscribe((s) => this.sports.set(s));
    this.facilityService.cities().subscribe((c) => this.cities.set(c));
  }

  /** Reads selected <option>s from the city multi-select dropdown. */
  onCitiesChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCities.set(Array.from(select.selectedOptions).map((o) => o.value));
  }

  search(): void {
    const { name, sport, type, onlyFreeToday } = this.form.getRawValue();
    this.facilityService
      .search({ name, sport, type: type as any, freeToday: onlyFreeToday })
      .subscribe((r) => {
        this.results.set(r);
        this.searched.set(true);
      });
  }

  setSort(key: SortKey): void {
    if (this.sortKey() === key) this.sortAsc.set(!this.sortAsc());
    else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }

  arrow(key: SortKey): string {
    if (this.sortKey() !== key) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }
}
