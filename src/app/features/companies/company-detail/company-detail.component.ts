import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { CompanyModulesService } from '../../../core/services/company-modules.service';
import { AdminViewService } from '../../../core/services/admin-view.service';
import { ApiListResponse } from '../../../core/models/pagination.model';
import { Company } from '../../../core/models/company.model';
import { ModuleCatalogItem } from '../../../core/models/module-request.model';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    AppIconComponent,
  ],
  templateUrl: './company-detail.component.html',
})
export class CompanyDetailComponent implements OnInit {
  authService         = inject(AuthService);
  private api         = inject(ApiService);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private companiesSvc = inject(CompaniesService);
  private modulesSvc  = inject(CompanyModulesService);
  private adminView   = inject(AdminViewService);
  private snackBar    = inject(MatSnackBar);
  private dialog      = inject(MatDialog);

  company        = signal<Company | null>(null);
  loadingCompany = signal(true);

  modules        = signal<ModuleCatalogItem[]>([]);
  loadingModules = signal(false);

  users          = signal<User[]>([]);
  loadingUsers   = signal(false);

  activeTab = signal<'info'|'modules'|'users'>('info');

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

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.api.get<ApiListResponse<User>>(`/platform/companies/${this.companyId}/users`, { page: 1, limit: 100 })
      .pipe(finalize(() => this.loadingUsers.set(false)))
      .subscribe({
        next: res => this.users.set(res.data ?? []),
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

  moduleStatusLabel(status: string | null): string {
    const map: Record<string, string> = {
      APPROVED: 'Activo', PENDING: 'Pendiente', REJECTED: 'Rechazado', REVOKED: 'Revocado', EXPIRED: 'Expirado',
    };
    return status ? (map[status] ?? status) : 'Sin solicitud';
  }

  companyStatusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Activa', SUSPENDED: 'Suspendida', PENDING: 'Pendiente', INACTIVE: 'Inactiva' };
    return m[s] ?? s;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Activo', INACTIVE: 'Inactivo', LOCKED: 'Bloqueado' };
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

  toggleUserStatus(user: User): void {
    const isActive = user.status === 'ACTIVE';
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       isActive ? 'Desactivar usuario' : 'Activar usuario',
        message:     `¿${isActive ? 'Desactivar' : 'Activar'} al usuario "${user.full_name}"?`,
        confirmText: isActive ? 'Desactivar' : 'Activar',
        danger:      isActive,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const path = isActive
        ? `/platform/users/${user.id}/deactivate`
        : `/platform/users/${user.id}/activate`;
      this.api.patch<{ success: boolean; data: User }>(path).subscribe({
        next: () => {
          this.snackBar.open(isActive ? 'Usuario desactivado' : 'Usuario activado', 'OK', { duration: 3000 });
          this.loadUsers();
        },
        error: err => this.snackBar.open(err?.error?.message || 'Error', 'OK', { duration: 4000 }),
      });
    });
  }
}
