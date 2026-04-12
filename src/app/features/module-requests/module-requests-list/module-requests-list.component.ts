import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { ModuleRequest, PlatformModule } from '../../../core/models/module-request.model';
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
  private svc = inject(ModuleRequestsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  authService = inject(AuthService);

  requests = signal<ModuleRequest[]>([]);
  availableModules = signal<PlatformModule[]>([]);
  loading = signal(true);
  saving = signal(false);
  showRequestForm = signal(false);
  forbidden = signal(false);
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
      this.svc.listPlatformModules().subscribe(mods => this.availableModules.set(mods.filter(m => m.is_active)));
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: res => { this.requests.set(res.data); this.loading.set(false); },
      error: (err) => {
        if (err?.status === 403) this.forbidden.set(true);
        this.loading.set(false);
      },
    });
  }

  loadAll(): void {
    this.loading.set(true);
    this.svc.listAll().subscribe({
      next: res => { this.requests.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submitRequest(): void {
    if (this.requestForm.invalid) { this.requestForm.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.requestForm.value;
    this.svc.create({ module_id: v.module_id!, comments: v.comments || undefined }).subscribe({
      next: () => {
        this.snackBar.open('Solicitud enviada', 'OK', { duration: 3000 });
        this.showRequestForm.set(false);
        this.requestForm.reset();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al enviar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  approve(req: ModuleRequest): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Aprobar solicitud', message: `¿Aprobar el módulo "${req.module?.name}"?`, confirmText: 'Aprobar' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.approve(req.id).subscribe({
        next: () => { this.snackBar.open('Solicitud aprobada', 'OK', { duration: 3000 }); this.loadAll(); },
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
      });
    });
  }

  statusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING:  'bg-amber-50 text-amber-700',
      APPROVED: 'bg-green-50 text-green-700',
      REJECTED: 'bg-red-50 text-red-700',
    };
    return m[s] ?? 'bg-gray-50 text-gray-600';
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING:  'Pendiente',
      APPROVED: 'Aprobada',
      REJECTED: 'Rechazada',
    };
    return m[s] ?? s;
  }
}
