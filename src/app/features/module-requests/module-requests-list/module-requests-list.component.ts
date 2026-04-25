import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ModuleRequestsService } from '../../../core/services/module-requests.service';
import { CompanyModulesService } from '../../../core/services/company-modules.service';
import { ModuleRequest, ModuleCatalogItem } from '../../../core/models/module-request.model';
import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-module-requests-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './module-requests-list.component.html',
})
export class ModuleRequestsListComponent implements OnInit {
  private svc        = inject(ModuleRequestsService);
  private modulesSvc = inject(CompanyModulesService);
  private snackBar   = inject(MatSnackBar);
  private dialog     = inject(MatDialog);
  authService        = inject(AuthService);

  requests     = signal<ModuleRequest[]>([]);
  catalog      = signal<ModuleCatalogItem[]>([]);
  requestingId = signal<number | null>(null);
  loading      = signal(true);
  forbidden    = signal(false);
  tab          = signal<'pending'|'approved'|'rejected'|'all'>('pending');

  private searchSignal = signal('');
  private statusSignal = signal('');

  searchControl = new FormControl('');
  statusControl = new FormControl('');

  filteredRequests = computed((): ModuleRequest[] => {
    const q = this.searchSignal().toLowerCase().trim();
    const s = this.statusSignal();
    return this.requests().filter(r => {
      const matchSearch = !q
        || (r.company?.name ?? '').toLowerCase().includes(q)
        || (r.module?.name  ?? '').toLowerCase().includes(q)
        || (r.module?.code  ?? '').toLowerCase().includes(q);
      const matchStatus = !s || r.status === s;
      return matchSearch && matchStatus;
    });
  });

  filteredByTab = computed((): ModuleRequest[] => {
    const t = this.tab();
    const list = this.filteredRequests();
    if (t === 'all') return list;
    return list.filter(r => r.status?.toLowerCase() === t);
  });

  pendingCount = computed(() => this.requests().filter(r => r.status?.toLowerCase() === 'pending').length);

  get isPlatformUser(): boolean { return this.authService.isSystemUser(); }

  ngOnInit(): void {
    if (this.isPlatformUser) {
      this.loadAll();
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(v => this.searchSignal.set(v ?? ''));
      this.statusControl.valueChanges
        .subscribe(v => this.statusSignal.set(v ?? ''));
    } else {
      this.loadCatalog();
    }
  }

  loadAll(): void {
    this.loading.set(true);
    this.svc.listAll().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => this.requests.set(res.data ?? []),
      error: ()  => this.requests.set([]),
    });
  }

  activate(req: ModuleRequest): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Activar módulo', message: `¿Activar "${req.module?.name}" para ${req.company?.name}?`, confirmText: 'Activar' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.approve(req.id).subscribe({
        next:  () => { this.snackBar.open('Módulo activado', 'OK', { duration: 3000 }); this.loadAll(); },
        error: () => {},
      });
    });
  }

  deactivate(req: ModuleRequest): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Rechazar solicitud', message: `¿Rechazar "${req.module?.name}" para ${req.company?.name}?`, confirmText: 'Rechazar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.reject(req.id).subscribe({
        next:  () => { this.snackBar.open('Solicitud rechazada', 'OK', { duration: 3000 }); this.loadAll(); },
        error: () => {},
      });
    });
  }

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

  statusLabel(s: string | null): string {
    const m: Record<string, string> = { PENDING: 'Pendiente', pending: 'Pendiente', APPROVED: 'Aprobada', approved: 'Aprobada', REJECTED: 'Rechazada', rejected: 'Rechazada' };
    return s ? (m[s] ?? s) : 'No solicitado';
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
  }
}
