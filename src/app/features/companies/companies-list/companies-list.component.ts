import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CompaniesService } from '../../../core/services/companies.service';
import { Company } from '../../../core/models/company.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule,
    MatPaginatorModule, MatTooltipModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  templateUrl: './companies-list.component.html',
})
export class CompaniesListComponent implements OnInit {
  private svc      = inject(CompaniesService);
  private snackBar = inject(MatSnackBar);
  private dialog   = inject(MatDialog);

  companies        = signal<Company[]>([]);
  loading          = signal(true);
  total            = signal(0);
  page             = signal(1);
  limit            = signal(20);
  displayedColumns = ['name', 'ruc', 'email', 'status', 'created', 'actions'];
  search = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list({ page: this.page(), limit: this.limit() }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: res => { this.companies.set(res.data ?? []); this.total.set(res.total ?? 0); },
      error: ()  => this.companies.set([]),
    });
  }

  onPageChange(e: PageEvent): void { this.page.set(e.pageIndex + 1); this.limit.set(e.pageSize); this.load(); }

  toggleStatus(company: Company): void {
    const isActive = company.status === 'ACTIVE';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: isActive ? 'Desactivar empresa' : 'Activar empresa',
        message: `¿${isActive ? 'Desactivar' : 'Activar'} la empresa "${company.name}"?`,
        confirmText: isActive ? 'Desactivar' : 'Activar',
        danger: isActive,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const obs = isActive ? this.svc.deactivate(company.id) : this.svc.activate(company.id);
      obs.subscribe({
        next: () => {
          this.snackBar.open(`Empresa ${isActive ? 'desactivada' : 'activada'}`, 'OK', { duration: 3000 });
          this.load();
        },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      ACTIVE:    'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      SUSPENDED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      PENDING:   'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      INACTIVE:  'bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-400',
    };
    return m[s] ?? 'bg-slate-50 text-slate-600';
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Activa', SUSPENDED: 'Suspendida', PENDING: 'Pendiente', INACTIVE: 'Inactiva' };
    return m[s] ?? s;
  }
}
