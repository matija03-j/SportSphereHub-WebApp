import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FacilityService, FacilityDetails as FD } from '../../../core/facility.service';
import { UPLOADS_BASE } from '../../../core/config';

@Component({
  selector: 'app-facility-details',
  imports: [RouterLink, DatePipe],
  templateUrl: './facility-details.html',
})
export class FacilityDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private facilityService = inject(FacilityService);

  facility = signal<FD | null>(null);
  notFound = signal(false);
  uploads = UPLOADS_BASE;

  typeLabel: Record<string, string> = { open: 'Otvoreni teren', closed: 'Zatvoreni teren', hall: 'Dvorana' };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.facilityService.details(id).subscribe({
      next: (f) => this.facility.set(f),
      error: () => this.notFound.set(true),
    });
  }
}
