import { AfterViewInit, Component, ElementRef, OnDestroy, inject, signal, viewChild } from '@angular/core';
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
    }

    <div class="row">
      <section class="card" style="flex:1">
        <h2>Termini po sportu</h2>
        @if (stats() && !stats()!.perSport.length) { <p class="muted">Nema podataka.</p> }
        <canvas #bar></canvas>
      </section>
      <section class="card" style="flex:1">
        <h2>Mesečna aktivnost</h2>
        @if (stats() && !stats()!.monthly.length) { <p class="muted">Nema podataka.</p> }
        <canvas #line></canvas>
      </section>
    </div>
  `,
})
export class Statistics implements AfterViewInit, OnDestroy {
  private statsService = inject(StatsService);
  stats = signal<AthleteStats | null>(null);

  // Canvases are always in the DOM, so these resolve before data arrives.
  bar = viewChild.required<ElementRef<HTMLCanvasElement>>('bar');
  line = viewChild.required<ElementRef<HTMLCanvasElement>>('line');

  private barChart?: Chart;
  private lineChart?: Chart;

  ngAfterViewInit(): void {
    this.statsService.athlete().subscribe((s) => {
      this.stats.set(s);
      this.render(s);
    });
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.lineChart?.destroy();
  }

  private render(s: AthleteStats): void {
    this.barChart?.destroy();
    this.lineChart?.destroy();

    this.barChart = new Chart(this.bar().nativeElement, {
      type: 'bar',
      data: {
        labels: s.perSport.map((p) => p.sport),
        datasets: [{ label: 'Broj termina', data: s.perSport.map((p) => p.count), backgroundColor: '#2f80c2' }],
      },
      options: { responsive: true, plugins: { legend: { display: false } } },
    });

    this.lineChart = new Chart(this.line().nativeElement, {
      type: 'line',
      data: {
        labels: s.monthly.map((m) => m.label),
        datasets: [{ label: 'Aktivnost', data: s.monthly.map((m) => m.count), borderColor: '#27ae60', tension: 0.3 }],
      },
      options: { responsive: true },
    });
  }
}
