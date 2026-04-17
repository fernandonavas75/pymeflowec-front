import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ModuleRequestsService } from '../../../core/services/module-requests.service';
import { CompanyModulesService } from '../../../core/services/company-modules.service';
import { ModuleRequest, ModuleCatalogItem } from '../../../core/models/module-request.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface CompanyGroup {
  id: number;
  name: string;
  requests: ModuleRequest[];
}

@Component({
  selector: 'app-module-requests-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatTooltipModule,
  ],
  templateUrl: './module-requests-list.component.html',
})
export class ModuleRequestsListComponent implements OnInit {
  private svc        = inject(ModuleRequestsService);
  private modulesSvc = inject(CompanyModulesService);
  private snackBar   = inject(MatSnackBar);
  private dialog     = inject(MatDialog);
  private fb         = inject(FormBuilder);
  authService        = inject(AuthService);

  requests     = signal<ModuleRequest[]>([]);
  catalog      = signal<ModuleCatalogItem[]>([]);
  requestingId = signal<number | null>(null);
  loading      = signal(true);
  forbidden    = signal(false);

  companySearch = new FormControl('');

  private grouped = computed((): CompanyGroup[] => {
    const map = new Map<number, CompanyGroup>();
    for (const r of this.requests()) {
      const id   = r.company_id;
      const name = r.company?.name ?? `Empresa #${id}`;
      if (!map.has(id)) map.set(id, { id, name, requests: [] });
      map.get(id)!.requests.push(r);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  });

  filteredGroups = computed((): CompanyGroup[] => {
    const q = (this.companySearch.value ?? '').toLowerCase().trim();
    if (!q) return this.grouped();
    return this.grouped().filter(g => g.name.toLowerCase().includes(q));
  });

  requestForm = this.fb.group({
    module_id: [null as number | null, Validators.required],
    comments:  [''],
  });

  get isPlatformUser(): boolean {
    return this.authService.isSystemUser();
  }

  ngOnInit(): void {
    if (this.isPlatformUser) {
      this.loadAll();
    } else {
      this.loadCatalog();
    }
  }

  // ── Vista plataforma ────────────────────────────────────────────────

  loadAll(): void {
    this.loading.set(true);
    this.svc.listAll().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => this.requests.set(res.data ?? []),
      error: ()  => this.requests.set([]),
    });
  }

  approve(req: ModuleRequest): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Aprobar solicitud', message: `¿Aprobar el módulo "${req.module?.name}" para ${req.company?.name}?`, confirmText: 'Aprobar' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.approve(req.id).subscribe({
        next:  () => { this.snackBar.open('Solicitud aprobada', 'OK', { duration: 3000 }); this.loadAll(); },
        error: () => {},
      });
    });
  }

  reject(req: ModuleRequest): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Rechazar solicitud', message: `¿Rechazar el módulo "${req.module?.name}" para ${req.company?.name}?`, confirmText: 'Rechazar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.reject(req.id).subscribe({
        next:  () => { this.snackBar.open('Solicitud rechazada', 'OK', { duration: 3000 }); this.loadAll(); },
        error: () => {},
      });
    });
  }

  // ── Vista tienda ────────────────────────────────────────────────────

  loadCatalog(): void {
    this.loading.set(true);
    this.modulesSvc.loadCatalog().pipe(finalize(() => this.loading.set(false))).subscribe({
      next:  items => this.catalog.set(items ?? []),
      error: (err) => { if (err?.status === 403) this.forbidden.set(true); },
    });
  }

  requestModule(item: ModuleCatalogItem): void {
    this.requestingId.set(item.id);
    this.svc.create({ module_id: item.id }).subscribe({
      next: () => {
        this.snackBar.open(`Solicitud enviada para "${item.name}"`, 'OK', { duration: 3000 });
        this.requestingId.set(null);
        this.loadCatalog();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al enviar', 'OK', { duration: 4000 });
        this.requestingId.set(null);
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────

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

  statusClass(s: string | null): string {
    const m: Record<string, string> = {
      PENDING:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      APPROVED: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      REJECTED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return s ? (m[s] ?? 'bg-slate-50 text-slate-600') : '';
  }

  statusLabel(s: string | null): string {
    const m: Record<string, string> = { PENDING: 'En espera', APPROVED: 'Activo', REJECTED: 'Rechazado' };
    return s ? (m[s] ?? s) : 'No solicitado';
  }

  statusIcon(s: string | null): string {
    const m: Record<string, string> = { PENDING: 'hourglass_empty', APPROVED: 'check_circle', REJECTED: 'cancel' };
    return s ? (m[s] ?? 'circle') : 'add_circle_outline';
  }
}
