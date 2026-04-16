import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuditLogsService } from '../../../core/services/audit-logs.service';
import { CompaniesService } from '../../../core/services/companies.service';
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
    MatChipsModule,
    MatExpansionModule,
  ],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {
  private auditSvc    = inject(AuditLogsService);
  private companiesSvc = inject(CompaniesService);

  logs             = signal<AuditLog[]>([]);
  loading          = signal(true);
  total            = signal(0);
  page             = signal(1);
  limit            = signal(50);
  companies        = signal<Company[]>([]);
  expandedRow      = signal<number | null>(null);

  displayedColumns = ['created_at', 'company', 'user', 'method', 'resource', 'status_code', 'ip_address', 'expand'];

  filters = new FormGroup({
    company_id: new FormControl<number | null>(null),
    method:     new FormControl<string>(''),
    status:     new FormControl<string>(''),   // '' | 'success' | 'error'
    search:     new FormControl(''),
    date_from:  new FormControl<Date | null>(null),
    date_to:    new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    this.loadCompanies();
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

    if (f.company_id) params['company_id'] = f.company_id;
    if (f.method)     params['method']     = f.method;
    if (f.search)     params['search']     = f.search!;

    if (f.status === 'success') params['status_max'] = 399;
    if (f.status === 'error')   params['status_min'] = 400;

    if (f.date_from) params['date_from'] = (f.date_from as Date).toISOString().slice(0, 10);
    if (f.date_to)   params['date_to']   = (f.date_to   as Date).toISOString().slice(0, 10);

    this.auditSvc.list(params).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => { this.logs.set(res.data); this.total.set(res.total); },
      error: ()  => this.logs.set([]),
    });
  }

  onPageChange(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.limit.set(e.pageSize);
    this.load();
  }

  clearFilters(): void {
    this.filters.reset({ company_id: null, method: '', status: '', search: '', date_from: null, date_to: null });
  }

  toggleExpand(id: number): void {
    this.expandedRow.update(v => v === id ? null : id);
  }

  methodClass(method: string): string {
    const map: Record<string, string> = {
      GET:    'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      POST:   'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      PUT:    'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      PATCH:  'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      DELETE: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    };
    return map[method] ?? 'bg-slate-100 text-slate-600';
  }

  statusClass(code: number): string {
    if (code < 300) return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (code < 400) return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    if (code < 500) return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  }

  detailsJson(log: AuditLog): string {
    try { return JSON.stringify(log.details, null, 2); } catch { return ''; }
  }
}
