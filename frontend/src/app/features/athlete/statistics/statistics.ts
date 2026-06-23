import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { StatsService, AthleteStats } from '../../../core/stats.service';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  template: `
    <h1>Statistika</h1>
    @if (stats(); as s) {
      <section class="card" style="margin-bottom:1rem">
        <p>Ukupna potrošnja na opremu (svi sportisti):
          <strong>{{ s.totalEquipmentSpend }} RSD</strong></p>
      </section>
      <div class="row">
        <section class="card" style="flex:1">
          <h2>Termini po sportu</h2>
          <canvas #bar></canvas>
        </section>
        <section class="card" style="flex:1">
          <h2>Mesečna aktivnost</h2>
          <canvas #line></canvas>
        </section>
      </div>
    } @else { <p class="muted">Učitavanje…</p> }
  `,
})
export class Statistics implements AfterViewInit {
  private statsService = inject(StatsService);
  stats = signal<AthleteStats | null>(null);

  bar = viewChild<ElementRef<HTMLCanvasElement>>('bar');
  line = viewChild<ElementRef<HTMLCanvasElement>>('line');

  ngAfterViewInit(): void {
    this.statsService.athlete().subscribe((s) => {
      this.stats.set(s);
      setTimeout(() => this.render(s), 0);
    });
  }

  private render(s: AthleteStats): void {
    const barEl = this.bar()?.nativeElement;
    const lineEl = this.line()?.nativeElement;
    if (barEl) {
      new Chart(barEl, {
        type: 'bar',
        data: {
          labels: s.perSport.map((p) => p.sport),
          datasets: [{ label: 'Broj termina', data: s.perSport.map((p) => p.count), backgroundColor: '#2f80c2' }],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }
    if (lineEl) {
      new Chart(lineEl, {
        type: 'line',
        data: {
          labels: s.monthly.map((m) => m.label),
          datasets: [{ label: 'Aktivnost', data: s.monthly.map((m) => m.count), borderColor: '#27ae60', tension: 0.3 }],
        },
        options: { responsive: true },
      });
    }
  }
}
