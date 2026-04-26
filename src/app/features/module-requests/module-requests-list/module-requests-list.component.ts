import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, startWith, finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModuleRequestsService } from '../../../core/services/module-requests.service';
import { CompanyModulesService } from '../../../core/services/company-modules.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { ModuleRequest, ModuleCatalogItem } from '../../../core/models/module-request.model';
import { Company } from '../../../core/models/company.model';
import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface CompanyModuleStats {
  company: Company;
  approved: number;
  pending: number;
}

@Component({
  selector: 'app-module-requests-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './module-requests-list.component.html',
})
export class ModuleRequestsListComponent implements OnInit {
  private svc          = inject(ModuleRequestsService);
  private modulesSvc   = inject(CompanyModulesService);
  private companiesSvc = inject(CompaniesService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  authService          = inject(AuthService);

  // ── Platform state ────────────────────────────────────────
  companies        = signal<Company[]>([]);
  allRequests      = signal<ModuleRequest[]>([]);
  loadingCompanies = signal(true);

  selectedCompany = signal<Company | null>(null);
  companyModules  = signal<ModuleCatalogItem[]>([]);
  loadingModules  = signal(false);
  processingId    = signal<number | null>(null);

  // Approve modal
  approveTarget = signal<ModuleCatalogItem | null>(null);
  approveMode   = signal<'permanent' | 'temporal'>('permanent');
  expiresAtCtrl = new FormControl('');

  searchCtrl = new FormControl('');
  private searchQ = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  // ── Store state ───────────────────────────────────────────
  catalog      = signal<ModuleCatalogItem[]>([]);
  requestingId = signal<number | null>(null);
  loading      = signal(true);
  forbidden    = signal(false);

  // ── Computed ──────────────────────────────────────────────
  get isPlatformUser(): boolean { return this.authService.isSystemUser(); }

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  companyStats = computed((): CompanyModuleStats[] => {
    const reqs = this.allRequests();
    return this.companies().map(c => ({
      company:  c,
      approved: reqs.filter(r => Number(r.company_id) === Number(c.id) && r.status === 'APPROVED').length,
      pending:  reqs.filter(r => Number(r.company_id) === Number(c.id) && r.status === 'PENDING').length,
    }));
  });

  filteredStats = computed(() => {
    const q = (this.searchQ() ?? '').toLowerCase().trim();
    if (!q) return this.companyStats();
    return this.companyStats().filter(cs =>
      cs.company.name.toLowerCase().includes(q) ||
      (cs.company.ruc ?? '').includes(q)
    );
  });

  pendingCount   = computed(() => this.allRequests().filter(r => r.status === 'PENDING').length);
  approvedModules = computed(() => this.companyModules().filter(m => m.status === 'APPROVED'));
  pendingModules  = computed(() => this.companyModules().filter(m => m.status === 'PENDING'));
  inactiveModules = computed(() =>
    this.companyModules().filter(m => m.status === 'REJECTED' || m.status === 'REVOKED' || m.status === 'EXPIRED')
  );

  // ── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    this.isPlatformUser ? this.loadPlatformData() : this.loadCatalog();
  }

  // ── Platform methods ──────────────────────────────────────
  loadPlatformData(): void {
    this.loadingCompanies.set(true);
    const currentCompany = this.selectedCompany();
    forkJoin({
      companies: this.companiesSvc.list({ limit: 500 }),
      requests:  this.svc.listAll({ limit: 1000 }),
    }).pipe(finalize(() => this.loadingCompanies.set(false))).subscribe({
      next: ({ companies, requests }) => {
        this.companies.set(companies.data);
        this.allRequests.set(requests.data);
        if (currentCompany) {
          this.loadingModules.set(true);
          this.modulesSvc.loadCatalogForCompany(currentCompany.id)
            .pipe(finalize(() => this.loadingModules.set(false)))
            .subscribe({
              next: items => this.companyModules.set(items),
              error: () => {},
            });
        }
      },
      error: () => {},
    });
  }

  selectCompany(company: Company): void {
    this.selectedCompany.set(company);
    this.companyModules.set([]);
    this.approveTarget.set(null);
    this.loadingModules.set(true);
    this.modulesSvc.loadCatalogForCompany(company.id)
      .pipe(finalize(() => this.loadingModules.set(false)))
      .subscribe({
        next: items => this.companyModules.set(items),
        error: () => this.companyModules.set([]),
      });
  }

  closeDrawer(): void {
    this.selectedCompany.set(null);
    this.companyModules.set([]);
    this.approveTarget.set(null);
  }

  openApproveModal(item: ModuleCatalogItem): void {
    this.approveMode.set('permanent');
    this.expiresAtCtrl.setValue('');
    this.approveTarget.set(item);
  }

  closeApproveModal(): void {
    this.approveTarget.set(null);
  }

  confirmApprove(): void {
    const target = this.approveTarget();
    if (!target?.request_id) return;

    const expiresAt = this.approveMode() === 'temporal'
      ? (this.expiresAtCtrl.value || null)
      : null;

    if (this.approveMode() === 'temporal' && !expiresAt) {
      this.snackBar.open('Selecciona una fecha de expiración', 'OK', { duration: 3000 });
      return;
    }

    const requestId = target.request_id;
    this.processingId.set(requestId);
    this.approveTarget.set(null);

    this.svc.approve(requestId, expiresAt ?? undefined).subscribe({
      next: () => {
        this.snackBar.open(`Módulo "${target.name}" activado`, 'OK', { duration: 3000 });
        this.processingId.set(null);
        this.refreshAfterAction();
      },
      error: () => { this.processingId.set(null); },
    });
  }

  reject(item: ModuleCatalogItem): void {
    if (!item.request_id) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Rechazar solicitud',
        message: `¿Rechazar el módulo "${item.name}" para esta empresa?`,
        confirmText: 'Rechazar',
        danger: true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      const id = item.request_id!;
      this.processingId.set(id);
      this.svc.reject(id).subscribe({
        next: () => {
          this.snackBar.open('Solicitud rechazada', 'OK', { duration: 3000 });
          this.processingId.set(null);
          this.refreshAfterAction();
        },
        error: () => { this.processingId.set(null); },
      });
    });
  }

  revoke(item: ModuleCatalogItem): void {
    const company = this.selectedCompany();
    if (!company) return;

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Revocar módulo',
        message: `¿Desactivar el módulo "${item.name}" para ${company.name}? La empresa perderá acceso inmediatamente. Los datos existentes no se eliminan.`,
        confirmText: 'Revocar',
        danger: true,
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;

      // Usar el marcador -1 como centinela para "procesando sin request_id"
      const sentinel = item.request_id ?? -item.id;
      this.processingId.set(sentinel);

      const call$ = item.request_id
        ? this.svc.revoke(item.request_id)
        : this.svc.revokeByModule(company.id, item.id);

      call$.subscribe({
        next: () => {
          this.snackBar.open(`Módulo "${item.name}" revocado`, 'OK', { duration: 3000 });
          this.processingId.set(null);
          this.refreshAfterAction();
        },
        error: () => { this.processingId.set(null); },
      });
    });
  }

  private refreshAfterAction(): void {
    const company = this.selectedCompany();
    this.svc.listAll({ limit: 1000 }).subscribe({ next: res => this.allRequests.set(res.data) });
    if (company) {
      this.loadingModules.set(true);
      this.modulesSvc.loadCatalogForCompany(company.id)
        .pipe(finalize(() => this.loadingModules.set(false)))
        .subscribe({
          next: items => this.companyModules.set(items),
          error: () => {},
        });
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  expiryLabel(expiresAt: string | null | undefined): string {
    if (!expiresAt) return 'Permanente';
    const d = new Date(expiresAt);
    if (d < new Date()) return 'Vencido';
    return `Vence ${d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }

  isExpired(expiresAt: string | null | undefined): boolean {
    return !!expiresAt && new Date(expiresAt) < new Date();
  }

  trialDaysLeft(expiresAt: string | null | undefined): number {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  companyStatusClass(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'success', INACTIVE: '', SUSPENDED: 'warn', PENDING: 'warn' };
    return m[s] ?? '';
  }

  companyStatusLabel(s: string): string {
    const m: Record<string, string> = { ACTIVE: 'Activa', INACTIVE: 'Inactiva', SUSPENDED: 'Suspendida', PENDING: 'Pendiente' };
    return m[s] ?? s;
  }

  // ── Store methods ─────────────────────────────────────────
  loadCatalog(): void {
    this.loading.set(true);
    this.modulesSvc.loadCatalog().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: items => this.catalog.set(items ?? []),
      error: err => { if (err?.status === 403) this.forbidden.set(true); },
    });
  }

  requestModule(item: ModuleCatalogItem): void {
    this.requestingId.set(item.id);
    this.svc.create({ module_id: item.id }).subscribe({
      next: (newRequest) => {
        this.snackBar.open(`Solicitud enviada para "${item.name}"`, 'OK', { duration: 3000 });
        this.catalog.update(items =>
          items.map(i => i.id === item.id
            ? { ...i, status: 'PENDING' as const, request_id: newRequest?.id ?? i.request_id }
            : i
          )
        );
        this.requestingId.set(null);
        this.loadCatalog();
      },
      error: err => {
        this.snackBar.open(err?.error?.message || 'Error al enviar', 'OK', { duration: 4000 });
        this.requestingId.set(null);
      },
    });
  }
}
