import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FacilityService, HomeInfo } from '../../../core/facility.service';
import { FacilitySearch } from '../../../shared/facility-search/facility-search';

@Component({
  selector: 'app-home',
  imports: [FacilitySearch, DatePipe],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private facilityService = inject(FacilityService);
  info = signal<HomeInfo | null>(null);

  ngOnInit(): void {
    this.facilityService.homeInfo().subscribe((i) => this.info.set(i));
  }

  discount(p: any): string {
    return p.discountType === 'percent' ? `${p.value}%` : `${p.value} RSD`;
  }
}
