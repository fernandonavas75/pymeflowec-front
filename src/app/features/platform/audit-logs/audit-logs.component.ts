import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AuditLogsService, ServerLog } from '../../../core/services/audit-logs.service';
import { CompaniesService } from '../../../core/services/companies.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditLog } from '../../../core/models/audit-log.model';
import { Company } from '../../../core/models/company.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
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

  displayedColumns = ['created_at', 'company', 'user', 'action', 'table_name', 'record_id', 'ip_address', 'expand'];

  filters = new FormGroup({
    company_id:  new FormControl<number | null>(null),
    action:      new FormControl<string>(''),
    table_name:  new FormControl(''),
    search:      new FormControl(''),
    date_from:   new FormControl<Date | null>(null),
    date_to:     new FormControl<Date | null>(null),
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
    if (f.date_from)   params['date_from']   = (f.date_from as Date).toISOString().slice(0, 10);
    if (f.date_to)     params['date_to']     = (f.date_to   as Date).toISOString().slice(0, 10);

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

  onPageChange(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.limit.set(e.pageSize);
    this.load();
  }

  clearFilters(): void {
    this.filters.reset({ company_id: null, action: '', table_name: '', search: '', date_from: null, date_to: null });
  }

  toggleExpand(id: number): void {
    this.expandedRow.update(v => v === id ? null : id);
  }

  actionClass(action: string): string {
    const map: Record<string, string> = {
      INSERT: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      UPDATE: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      DELETE: 'bg-red-50  dark:bg-red-900/30  text-red-700  dark:text-red-300',
    };
    return map[action?.toUpperCase()] ?? 'bg-slate-100 text-slate-600';
  }

  valuesJson(values: Record<string, unknown> | null | undefined): string {
    try { return values ? JSON.stringify(values, null, 2) : ''; } catch { return ''; }
  }

  hasValues(log: AuditLog): boolean {
    return !!(log.old_values || log.new_values);
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

  serverLogRowClass(level: string): string {
    const map: Record<string, string> = {
      error: 'bg-red-50/50 dark:bg-red-900/10',
      warn:  'bg-amber-50/50 dark:bg-amber-900/10',
    };
    return map[level] ?? '';
  }

  serverLogBadgeClass(level: string): string {
    const map: Record<string, string> = {
      error: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      warn:  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      info:  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    };
    return map[level] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
  }
}
