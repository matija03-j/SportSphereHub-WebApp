import { Component } from '@angular/core';
import { FacilitySearch } from '../../../shared/facility-search/facility-search';

@Component({
  selector: 'app-athlete-search',
  imports: [FacilitySearch],
  template: `
    <h1>Pretraga i rezervacija</h1>
    <app-facility-search [showTodayFilter]="true" detailsBase="/athlete/facility" />
  `,
})
export class AthleteSearch {}
