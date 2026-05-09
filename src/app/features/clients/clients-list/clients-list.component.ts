import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomersService } from '../../../core/services/customers.service';
import { InvoicesService } from '../../../core/services/invoices.service';
import { Customer, CustomerType } from '../../../core/models/customer.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  private customersService = inject(CustomersService);
  private invoicesService  = inject(InvoicesService);
  private dialog           = inject(MatDialog);
  private snackBar         = inject(MatSnackBar);
  private fb               = inject(FormBuilder);

  private allCustomers  = signal<Customer[]>([]);
  private invoiceStats  = signal<Map<string, { count: number; total: number }>>(new Map());
  loading   = signal(true);
  tab       = signal<'all' | 'RUC' | 'CEDULA' | 'FINAL_CONSUMER'>('all');
  modalOpen = signal(false);
  editing   = signal<Customer | null>(null);
  saving    = signal(false);

  searchCtrl = new FormControl('');
  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  form = this.fb.group({
    customer_type:   ['CEDULA' as CustomerType, Validators.required],
    document_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13)]],
    full_name:       ['', [Validators.required, Validators.minLength(3)]],
    email:           ['', Validators.email],
    phone:           ['', Validators.maxLength(10)],
    address:         [''],
  });

  get isNew(): boolean { return !this.editing(); }

  totalCount  = computed(() => this.allCustomers().length);
  rucCount    = computed(() => this.allCustomers().filter(c => c.customer_type === 'RUC').length);
  cedulaCount = computed(() => this.allCustomers().filter(c => c.customer_type === 'CEDULA').length);
  finalCount  = computed(() => this.allCustomers().filter(c => c.customer_type === 'FINAL_CONSUMER').length);

  filteredCustomers = computed(() => {
    let list = this.allCustomers();
    const t = this.tab();
    if (t !== 'all') list = list.filter(c => c.customer_type === t);
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.document_number.includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
    return list;
  });

  ngOnInit(): void { this.load(); this.loadStats(); }

  loadStats(): void {
    this.invoicesService.list({ limit: 500 }).subscribe({
      next: res => {
        const map = new Map<string, { count: number; total: number }>();
        for (const inv of res.data) {
          if (inv.status === 'CANCELLED' || !inv.customer_id) continue;
          const key  = String(inv.customer_id);
          const curr = map.get(key) ?? { count: 0, total: 0 };
          map.set(key, { count: curr.count + 1, total: curr.total + parseFloat(String(inv.total || 0)) });
        }
        this.invoiceStats.set(map);
      },
      error: () => this.invoiceStats.set(new Map()),
    });
  }

  statsFor(customerId: number): { count: number; total: number } {
    return this.invoiceStats().get(String(customerId)) ?? { count: 0, total: 0 };
  }

  load(): void {
    this.loading.set(true);
    this.customersService.list({ limit: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => this.allCustomers.set(res.data ?? []),
        error: ()  => this.allCustomers.set([]),
      });
  }

  openNew(): void {
    this.editing.set(null);
    this.form.reset({ customer_type: 'CEDULA', document_number: '', full_name: '', email: '', phone: '', address: '' });
    this.modalOpen.set(true);
  }

  openEdit(c: Customer): void {
    this.editing.set(c);
    this.form.patchValue({
      customer_type:   c.customer_type,
      document_number: c.document_number,
      full_name:       c.full_name,
      email:   c.email   ?? '',
      phone:   c.phone   ?? '',
      address: c.address ?? '',
    });
    this.modalOpen.set(true);
  }

  saveCustomer(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const data = {
      customer_type:   v.customer_type as CustomerType,
      document_number: v.document_number!,
      full_name:       v.full_name!,
      email:   v.email   || undefined,
      phone:   v.phone   || undefined,
      address: v.address || undefined,
    };
    const obs = this.isNew
      ? this.customersService.create(data)
      : this.customersService.update(this.editing()!.id, data);
    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isNew ? 'Cliente creado' : 'Cliente actualizado', 'OK', { duration: 3000 });
        this.modalOpen.set(false);
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }

  deleteCustomer(c: Customer): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar cliente', message: `¿Eliminar a "${c.full_name}"?`, confirmText: 'Eliminar', danger: true },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.customersService.remove(c.id).subscribe({
        next: () => {
          this.snackBar.open('Cliente eliminado', 'OK', { duration: 3000 });
          this.modalOpen.set(false);
          this.load();
        },
        error: () => {},
      });
    });
  }

  typeLabel(t: string): string {
    return t === 'RUC' ? 'RUC' : t === 'CEDULA' ? 'Cédula' : 'Cons. Final';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  exportCsv(): void {
    const rows = this.filteredCustomers();
    const headers = ['Nombre', 'Tipo', 'Documento', 'Email', 'Teléfono', 'Dirección', 'Facturas', 'Total facturado', 'Fecha registro'];
    const lines = rows.map(c => {
      const stats = this.statsFor(c.id);
      return [
        c.full_name,
        this.typeLabel(c.customer_type),
        c.document_number,
        c.email ?? '',
        c.phone ?? '',
        c.address ?? '',
        stats.count,
        stats.total.toFixed(2),
        this.formatDate(c.created_at),
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    this.downloadCsv([headers.join(','), ...lines].join('\n'), 'clientes');
  }

  private downloadCsv(content: string, name: string): void {
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  get docMaxLength(): number  { return this.form.get('customer_type')?.value === 'RUC' ? 13 : 10; }
  get docPlaceholder(): string { return this.form.get('customer_type')?.value === 'RUC' ? '1790012345001' : '1712345678'; }
  get nameLabel(): string      { return this.form.get('customer_type')?.value === 'RUC' ? 'Razón social' : 'Nombres y apellidos'; }
  get namePlaceholder(): string { return this.form.get('customer_type')?.value === 'RUC' ? 'Empresa S.A.' : 'Juan Pérez'; }
}
