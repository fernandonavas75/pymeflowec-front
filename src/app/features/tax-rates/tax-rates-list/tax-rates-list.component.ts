import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { TaxRate } from '../../../core/models/tax-rate.model';

@Component({
  selector: 'app-tax-rates-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Tasas de impuesto</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestiona las tasas de IVA y otros impuestos</p>
        </div>
        <a routerLink="/tax-rates/new" mat-flat-button color="primary" class="flex items-center gap-2">
          <mat-icon>add</mat-icon>
          Nueva tasa
        </a>
      </div>

      <div class="table-container">
        @if (loading()) {
          <div class="flex justify-center py-20">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else {
          <table mat-table [dataSource]="taxRates()" class="w-full">
            <ng-container matColumnDef="tax_name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let t" class="font-medium">{{ t.tax_name }}</td>
            </ng-container>
            <ng-container matColumnDef="percentage">
              <th mat-header-cell *matHeaderCellDef>Porcentaje</th>
              <td mat-cell *matCellDef="let t">{{ t.percentage }}%</td>
            </ng-container>
            <ng-container matColumnDef="valid_from">
              <th mat-header-cell *matHeaderCellDef>Vigente desde</th>
              <td mat-cell *matCellDef="let t">{{ t.valid_from | date:'dd/MM/yyyy' }}</td>
            </ng-container>
            <ng-container matColumnDef="is_active">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let t">
                <span [class]="t.is_active ? 'badge-active' : 'badge-inactive'">
                  {{ t.is_active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let t">
                <a [routerLink]="['/tax-rates', t.id, 'edit']" mat-icon-button matTooltip="Editar">
                  <mat-icon class="text-slate-400">edit</mat-icon>
                </a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell text-center py-12 text-slate-400" [attr.colspan]="displayedColumns.length">
                No hay tasas de impuesto registradas
              </td>
            </tr>
          </table>
        }
      </div>
    </div>
  `,
})
export class TaxRatesListComponent implements OnInit {
  private taxRatesService = inject(TaxRatesService);
  private snackBar = inject(MatSnackBar);

  taxRates = signal<TaxRate[]>([]);
  loading = signal(true);

  displayedColumns = ['tax_name', 'percentage', 'valid_from', 'is_active', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.taxRatesService.list().subscribe({
      next: res => {
        this.taxRates.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
