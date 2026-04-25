import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompaniesService } from '../../../core/services/companies.service';
import { AuthService } from '../../../core/services/auth.service';
import { Company, CompanyStatus } from '../../../core/models/company.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-companies-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AppIconComponent],
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
  tab       = signal<'all'|'ACTIVE'|'SUSPENDED'|'PENDING'>('all');

  searchCtrl = new FormControl('');

  filteredCompanies = computed(() => {
    const t = this.tab();
    return t === 'all' ? this.companies() : this.companies().filter(c => c.status === t);
  });

  ngOnInit(): void {
    this.load();
    this.searchCtrl.valueChanges.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string | number | undefined> = { page: this.page(), limit: this.limit() };
    const q = this.searchCtrl.value?.trim();
    if (q) params['search'] = q;

    this.svc.list(params).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => { this.companies.set(res.data ?? []); this.total.set(res.total ?? 0); },
      error: ()  => this.companies.set([]),
    });
  }

  changePage(delta: number): void { this.page.update(p => p + delta); this.load(); }
  pageEnd(): number { return Math.min(this.page() * this.limit(), this.total()); }

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

  statusLabel(s: CompanyStatus): string {
    const m: Record<CompanyStatus, string> = {
      ACTIVE: 'Activa', SUSPENDED: 'Suspendida', PENDING: 'Pendiente', INACTIVE: 'Inactiva',
    };
    return m[s] ?? s;
  }

  statusKey(s: CompanyStatus): string {
    const m: Record<CompanyStatus, string> = {
      ACTIVE: 'ACTIVE', SUSPENDED: 'suspended', PENDING: 'pending', INACTIVE: 'INACTIVE',
    };
    return m[s] ?? s.toLowerCase();
  }
}
