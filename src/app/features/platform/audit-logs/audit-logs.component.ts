import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { AuditLogsService, ServerLog } from '../../../core/services/audit-logs.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditLog } from '../../../core/models/audit-log.model';
import { Company } from '../../../core/models/company.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {
  private auditSvc     = inject(AuditLogsService);
  private companiesSvc = inject(CompaniesService);
  authService          = inject(AuthService);

  logs            = signal<AuditLog[]>([]);
  loading         = signal(true);
  total           = signal(0);
  page            = signal(1);
  limit           = signal(50);
  companies       = signal<Company[]>([]);
  expandedRow     = signal<number | null>(null);
  apiError        = signal<{ status: number; message: string } | null>(null);
  endpointMissing = computed(() => this.apiError()?.status === 404);

  activeTab  = signal<'audit' | 'server'>('audit');
  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));

  filters = new FormGroup({
    company_id: new FormControl<number | null>(null),
    action:     new FormControl<string>(''),
    table_name: new FormControl(''),
    search:     new FormControl(''),
    date_from:  new FormControl(''),
    date_to:    new FormControl(''),
  });

  serverLogs        = signal<ServerLog[]>([]);
  serverLogsLoading = signal(false);
  serverLogsLevel   = new FormControl('');
  serverLogsLimit   = new FormControl<number>(200);

  ngOnInit(): void {
    if (this.authService.isPlatformAdmin()) {
      this.loadCompanies();
      this.loadServerLogs();
    }
    this.load();
    this.filters.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  private loadCompanies(): void {
    this.companiesSvc.list({ page: 1, limit: 200 }).subscribe({
      next: res => this.companies.set(res.data),
    });
  }

  load(): void {
    this.loading.set(true);
    const f = this.filters.value;
    const params: Record<string, string | number | boolean | undefined> = {
      page:  this.page(),
      limit: this.limit(),
    };
    if (f.company_id)  params['company_id']  = f.company_id;
    if (f.action)      params['action']      = f.action!;
    if (f.table_name)  params['table_name']  = f.table_name!;
    if (f.search)      params['search']      = f.search!;
    if (f.date_from)   params['date_from']   = f.date_from!;
    if (f.date_to)     params['date_to']     = f.date_to!;

    this.auditSvc.list(params).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => {
        this.apiError.set(null);
        this.logs.set(res.data);
        this.total.set(res.total);
      },
      error: (err: HttpErrorResponse) => {
        this.apiError.set({ status: err.status, message: err.error?.message ?? 'Error al cargar los logs' });
        this.logs.set([]);
      },
    });
  }

  prevPage(): void {
    if (this.page() > 1) { this.page.update(p => p - 1); this.load(); }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.load(); }
  }

  clearFilters(): void {
    this.filters.reset({ company_id: null, action: '', table_name: '', search: '', date_from: '', date_to: '' });
  }

  setActionFilter(action: string): void {
    this.filters.get('action')!.setValue(action);
  }

  toggleExpand(id: number): void {
    this.expandedRow.update(v => v === id ? null : id);
  }

  actionBadge(action: string): string {
    const map: Record<string, string> = {
      INSERT: 'success',
      UPDATE: 'accent',
      DELETE: 'danger',
    };
    return map[action?.toUpperCase()] ?? 'neutral';
  }

  valuesJson(values: Record<string, unknown> | null | undefined): string {
    try { return values ? JSON.stringify(values, null, 2) : ''; } catch { return ''; }
  }

  hasValues(log: AuditLog): boolean {
    return !!(log.old_values || log.new_values);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-EC', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  loadServerLogs(): void {
    this.serverLogsLoading.set(true);
    const level = this.serverLogsLevel.value ?? '';
    const limit = this.serverLogsLimit.value ?? 200;
    this.auditSvc.serverLogs({ level: level || undefined, limit })
      .pipe(finalize(() => this.serverLogsLoading.set(false)))
      .subscribe({
        next: logs => this.serverLogs.set(logs),
        error: ()   => this.serverLogs.set([]),
      });
  }

  serverLogBadge(level: string): string {
    const map: Record<string, string> = {
      error: 'danger',
      warn:  'warn',
      info:  'accent',
    };
    return map[level] ?? 'neutral';
  }

  serverLogRowStyle(level: string): string {
    if (level === 'error') return 'background:var(--danger-soft)';
    if (level === 'warn')  return 'background:var(--warn-soft)';
    return '';
  }
}
