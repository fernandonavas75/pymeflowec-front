import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CompaniesService } from '../../../core/services/companies.service';
import { AuthService } from '../../../core/services/auth.service';
import { Company } from '../../../core/models/company.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatSelectModule,
    MatPaginatorModule, MatTooltipModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  templateUrl: './companies-list.component.html',
})
export class CompaniesListComponent implements OnInit {
  private svc      = inject(CompaniesService);
  private snackBar = inject(MatSnackBar);
  private dialog   = inject(MatDialog);
  authService      = inject(AuthService);

  companies = signal<Company[]>([]);
  loading   = signal(true);
  total     = signal(0);
  page      = signal(1);
  limit     = signal(24);

  filters = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
  });

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    const { search, status } = this.filters.value;
    const params: Record<string, string | number | undefined> = {
      page:  this.page(),
      limit: this.limit(),
    };
    if (search?.trim()) params['search'] = search.trim();
    if (status)         params['status'] = status;

    this.svc.list(params).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => { this.companies.set(res.data ?? []); this.total.set(res.total ?? 0); },
      error: ()  => this.companies.set([]),
    });
  }

  onPageChange(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.limit.set(e.pageSize);
    this.load();
  }

  toggleStatus(company: Company): void {
    const isActive = company.status === 'ACTIVE';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       isActive ? 'Desactivar empresa' : 'Activar empresa',
        message:     `¿${isActive ? 'Desactivar' : 'Activar'} la empresa "${company.name}"?`,
        confirmText: isActive ? 'Desactivar' : 'Activar',
        danger:      isActive,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const obs = isActive ? this.svc.deactivate(company.id) : this.svc.activate(company.id);
      obs.subscribe({
        next:  () => { this.snackBar.open(`Empresa ${isActive ? 'desactivada' : 'activada'}`, 'OK', { duration: 3000 }); this.load(); },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }

  avatarColor(name: string): string {
    const palette = [
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    ];
    return palette[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % palette.length];
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
