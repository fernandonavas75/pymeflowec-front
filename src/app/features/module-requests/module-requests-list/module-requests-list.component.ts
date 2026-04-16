import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
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

@Component({
  selector: 'app-module-requests-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatTooltipModule,
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

  // Vista plataforma
  requests        = signal<ModuleRequest[]>([]);
  // Vista tienda — catálogo completo
  catalog         = signal<ModuleCatalogItem[]>([]);
  requestingId    = signal<number | null>(null);

  loading         = signal(true);
  saving          = signal(false);
  showRequestForm = signal(false);
  forbidden       = signal(false);
  displayedColumns = signal<string[]>(['module', 'status', 'date', 'actions']);

  requestForm = this.fb.group({
    module_id: [null as number | null, Validators.required],
    comments:  [''],
  });

  get isPlatformUser(): boolean {
    return this.authService.isSystemUser();
  }

  ngOnInit(): void {
    if (this.isPlatformUser) {
      this.displayedColumns.set(['org', 'module', 'status', 'date', 'actions']);
      this.loadAll();
    } else {
      this.loadCatalog();
    }
  }

  // ── Vista plataforma ────────────────────────────────────────────────

  loadAll(): void {
    this.loading.set(true);
    this.svc.listAll().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: res => this.requests.set(res.data ?? []),
      error: ()  => this.requests.set([]),
    });
  }

  approve(req: ModuleRequest): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Aprobar solicitud', message: `¿Aprobar el módulo "${req.module?.name}"?`, confirmText: 'Aprobar' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.approve(req.id).subscribe({
        next: () => { this.snackBar.open('Solicitud aprobada', 'OK', { duration: 3000 }); this.loadAll(); },
        error: () => {},
      });
    });
  }

  reject(req: ModuleRequest): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Rechazar solicitud', message: `¿Rechazar el módulo "${req.module?.name}"?`, confirmText: 'Rechazar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.reject(req.id).subscribe({
        next: () => { this.snackBar.open('Solicitud rechazada', 'OK', { duration: 3000 }); this.loadAll(); },
        error: () => {},
      });
    });
  }

  // ── Vista tienda ────────────────────────────────────────────────────

  loadCatalog(): void {
    this.loading.set(true);
    this.modulesSvc.loadCatalog().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: items => this.catalog.set(items ?? []),
      error: (err) => {
        if (err?.status === 403) this.forbidden.set(true);
      },
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

  // ── Helpers compartidos ─────────────────────────────────────────────

  statusClass(s: string | null): string {
    const m: Record<string, string> = {
      PENDING:  'bg-amber-50 text-amber-700',
      APPROVED: 'bg-green-50 text-green-700',
      REJECTED: 'bg-red-50 text-red-700',
    };
    return s ? (m[s] ?? 'bg-gray-50 text-gray-600') : '';
  }

  statusLabel(s: string | null): string {
    const m: Record<string, string> = {
      PENDING:  'En espera',
      APPROVED: 'Activo',
      REJECTED: 'Rechazado',
    };
    return s ? (m[s] ?? s) : 'No solicitado';
  }

  statusIcon(s: string | null): string {
    const m: Record<string, string> = {
      PENDING:  'hourglass_empty',
      APPROVED: 'check_circle',
      REJECTED: 'cancel',
    };
    return s ? (m[s] ?? 'circle') : 'add_circle_outline';
  }
}
