import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CompaniesService } from '../../../core/services/companies.service';
import { CompanyModulesService } from '../../../core/services/company-modules.service';
import { UsersService } from '../../../core/services/users.service';
import { AdminViewService } from '../../../core/services/admin-view.service';
import { Company } from '../../../core/models/company.model';
import { ModuleCatalogItem } from '../../../core/models/module-request.model';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './company-detail.component.html',
})
export class CompanyDetailComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private companiesSvc = inject(CompaniesService);
  private modulesSvc  = inject(CompanyModulesService);
  private usersSvc    = inject(UsersService);
  private adminView   = inject(AdminViewService);
  private snackBar    = inject(MatSnackBar);
  private dialog      = inject(MatDialog);

  company        = signal<Company | null>(null);
  loadingCompany = signal(true);

  modules        = signal<ModuleCatalogItem[]>([]);
  loadingModules = signal(false);

  users          = signal<User[]>([]);
  loadingUsers   = signal(false);

  moduleColumns = ['name', 'code', 'status'];
  userColumns   = ['avatar', 'full_name', 'email', 'role', 'status'];

  get companyId(): number { return Number(this.route.snapshot.paramMap.get('id')); }

  isCurrentClientView = signal(false);

  ngOnInit(): void {
    this.isCurrentClientView.set(
      this.adminView.isClientViewMode() && this.adminView.viewedCompany()?.id === this.companyId
    );
    this.loadCompany();
    this.loadModules();
    this.loadUsers();
  }

  private loadCompany(): void {
    this.loadingCompany.set(true);
    this.companiesSvc.getById(this.companyId).pipe(finalize(() => this.loadingCompany.set(false))).subscribe({
      next: c  => this.company.set(c),
      error: () => this.company.set(null),
    });
  }

  private loadModules(): void {
    this.loadingModules.set(true);
    this.modulesSvc.loadCatalogForCompany(this.companyId).pipe(finalize(() => this.loadingModules.set(false))).subscribe({
      next: items => this.modules.set(items),
      error: ()    => this.modules.set([]),
    });
  }

  private loadUsers(): void {
    this.loadingUsers.set(true);
    this.usersSvc.list({ page: 1, limit: 100, company_id: this.companyId }).pipe(finalize(() => this.loadingUsers.set(false))).subscribe({
      next: res => this.users.set(res.data),
      error: ()  => this.users.set([]),
    });
  }

  enterClientView(): void {
    const c = this.company();
    if (!c) return;
    this.adminView.enterClientView({ id: c.id, name: c.name });
    this.isCurrentClientView.set(true);
    this.snackBar.open(`Modo cliente activado: ${c.name}`, 'OK', { duration: 3000 });
    this.router.navigate(['/dashboard']);
  }

  exitClientView(): void {
    this.adminView.exitClientView();
    this.isCurrentClientView.set(false);
    this.snackBar.open('Modo cliente desactivado', 'OK', { duration: 2000 });
  }

  toggleStatus(company: Company): void {
    const isActive = company.status === 'ACTIVE';
    const isSuspended = company.status === 'SUSPENDED';

    let action: 'activate' | 'deactivate' | 'suspend';
    let title: string;
    let message: string;
    let confirmText: string;
    let danger: boolean;

    if (isActive) {
      action = 'suspend';
      title = 'Suspender empresa';
      message = `¿Suspender la empresa "${company.name}"? No podrá iniciar sesión.`;
      confirmText = 'Suspender';
      danger = true;
    } else if (isSuspended) {
      action = 'activate';
      title = 'Reactivar empresa';
      message = `¿Reactivar la empresa "${company.name}"?`;
      confirmText = 'Reactivar';
      danger = false;
    } else {
      action = 'activate';
      title = 'Activar empresa';
      message = `¿Activar la empresa "${company.name}"?`;
      confirmText = 'Activar';
      danger = false;
    }

    this.dialog.open(ConfirmDialogComponent, { data: { title, message, confirmText, danger } })
      .afterClosed().subscribe(ok => {
        if (!ok) return;
        const obs =
          action === 'activate'   ? this.companiesSvc.activate(company.id) :
          action === 'suspend'    ? this.companiesSvc.suspend(company.id) :
                                    this.companiesSvc.deactivate(company.id);
        obs.subscribe({
          next: updated => {
            this.company.set(updated);
            this.snackBar.open('Estado actualizado', 'OK', { duration: 3000 });
          },
          error: err => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
        });
      });
  }

  moduleStatusClass(status: string | null): string {
    const map: Record<string, string> = {
      APPROVED: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      PENDING:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      REJECTED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return status ? (map[status] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-500') : 'bg-slate-100 dark:bg-slate-700 text-slate-400';
  }

  moduleStatusLabel(status: string | null): string {
    const map: Record<string, string> = {
      APPROVED: 'Activo', PENDING: 'Pendiente', REJECTED: 'Rechazado',
    };
    return status ? (map[status] ?? status) : 'Sin solicitud';
  }

  moduleStatusIcon(status: string | null): string {
    const map: Record<string, string> = {
      APPROVED: 'check_circle', PENDING: 'hourglass_empty', REJECTED: 'cancel',
    };
    return map[status ?? ''] ?? 'radio_button_unchecked';
  }

  companyStatusClass(s: string): string {
    const m: Record<string, string> = {
      ACTIVE:    'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      SUSPENDED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      PENDING:   'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      INACTIVE:  'bg-slate-100 dark:bg-slate-700 text-slate-500',
    };
    return m[s] ?? 'bg-slate-100 text-slate-500';
  }

  companyStatusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Activa', SUSPENDED: 'Suspendida', PENDING: 'Pendiente', INACTIVE: 'Inactiva' };
    return m[s] ?? s;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  roleLabel(name: string): string {
    const map: Record<string, string> = {
      STORE_ADMIN:  'Administrador',
      STORE_SELLER: 'Vendedor',
    };
    return map[name] ?? name;
  }
}
