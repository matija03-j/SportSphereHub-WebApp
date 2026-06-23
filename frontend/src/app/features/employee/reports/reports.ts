import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/employee.service';

@Component({
  selector: 'app-employee-reports',
  imports: [FormsModule],
  template: `
    <h1>Mesečni izveštaji (PDF)</h1>
    @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
    <section class="card">
      <div class="form-group" style="max-width:220px">
        <label>Mesec</label>
        <input type="month" [(ngModel)]="month" />
      </div>
      <button class="btn" (click)="download('occupancy')">Popunjenost terena</button>
      <button class="btn" (click)="download('equipment')">Promet opreme</button>
      <p class="muted" style="font-size:0.85rem;margin-top:0.5rem">
        Izveštaji se generišu na serveru (pdfkit) i preuzimaju kao PDF.
      </p>
    </section>
  `,
})
export class EmployeeReports {
  private employeeService = inject(EmployeeService);
  month = new Date().toISOString().slice(0, 7);
  error = signal('');

  download(type: 'occupancy' | 'equipment'): void {
    const obs =
      type === 'occupancy'
        ? this.employeeService.occupancyReport(this.month)
        : this.employeeService.equipmentReport(this.month);
    obs.subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${this.month}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('Generisanje izveštaja nije uspelo.'),
    });
  }
}
