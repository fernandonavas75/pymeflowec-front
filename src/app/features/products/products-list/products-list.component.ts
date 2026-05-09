import { Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { startWith, finalize, forkJoin } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/models/product.model';
import { TaxRate } from '../../../core/models/tax-rate.model';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { StockAdjustDialogComponent } from '../stock-adjust-dialog/stock-adjust-dialog.component';
import { CsvImportDialogComponent } from '../csv-import-dialog/csv-import-dialog.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, AppIconComponent],
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent implements OnInit {
  private productsService  = inject(ProductsService);
  private taxRatesService  = inject(TaxRatesService);
  private dialog           = inject(MatDialog);
  private snackBar         = inject(MatSnackBar);
  authService              = inject(AuthService);

  readonly PAGE_SIZE = 20;

  private allProducts = signal<Product[]>([]);
  private taxRatesMap = signal<Record<number, TaxRate>>({});
  loading        = signal(true);
  tabFilter      = signal<'all' | 'low' | 'out'>('all');
  searchCtrl     = new FormControl('');
  productPopup   = signal<Product | null>(null);
  supplierFilter = signal<string | null>(null);
  statusFilter   = signal<'ACTIVE' | 'INACTIVE' | null>(null);
  openDropdown   = signal<'supplier' | 'status' | null>(null);
  currentPage    = signal(0);

  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  uniqueSuppliers = computed(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const p of this.allProducts()) {
      if (p.supplier?.name && !seen.has(p.supplier.name)) {
        seen.add(p.supplier.name);
        result.push(p.supplier.name);
      }
    }
    return result.sort();
  });

  hasActiveFilters = computed(() => !!this.supplierFilter() || !!this.statusFilter());

  lowCount  = computed(() => this.allProducts().filter(p => p.stock > 0 && p.stock <= p.min_stock && p.status === 'ACTIVE').length);
  outCount  = computed(() => this.allProducts().filter(p => p.stock === 0 && p.status === 'ACTIVE').length);
  alertCount = computed(() => this.lowCount() + this.outCount());
  totalCount = computed(() => this.allProducts().filter(p => p.status === 'ACTIVE').length);

  filteredProducts = computed(() => {
    let list = this.allProducts();
    const tab = this.tabFilter();
    if (tab === 'low') list = list.filter(p => p.stock > 0 && p.stock <= p.min_stock);
    if (tab === 'out') list = list.filter(p => p.stock === 0);
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (q) list = list.filter(p =>
      p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q)
    );
    const supplier = this.supplierFilter();
    if (supplier) list = list.filter(p => p.supplier?.name === supplier);
    const status = this.statusFilter();
    if (status) list = list.filter(p => p.status === status);
    return list;
  });

  totalPages = computed(() => Math.ceil(this.filteredProducts().length / this.PAGE_SIZE));

  pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  pagedProducts = computed(() => {
    const start = this.currentPage() * this.PAGE_SIZE;
    return this.filteredProducts().slice(start, start + this.PAGE_SIZE);
  });

  pageRangeLabel = computed(() => {
    const from = this.currentPage() * this.PAGE_SIZE + 1;
    const to   = Math.min((this.currentPage() + 1) * this.PAGE_SIZE, this.filteredProducts().length);
    return `${from}–${to} de ${this.filteredProducts().length}`;
  });

  ngOnInit(): void {
    this.searchCtrl.valueChanges.subscribe(() => this.currentPage.set(0));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      products: this.productsService.list({ page: 1, limit: 1000 }),
      taxes:    this.taxRatesService.list({ page: 1, limit: 100 }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ products, taxes }) => {
          const map: Record<number, TaxRate> = {};
          for (const t of taxes.data ?? []) map[t.id] = t;
          this.taxRatesMap.set(map);
          this.allProducts.set(products.data ?? []);
        },
        error: () => this.allProducts.set([]),
      });
  }

  stockState(p: Product): 'low' | 'out' | '' {
    return p.stock === 0 ? 'out' : p.stock <= p.min_stock ? 'low' : '';
  }

  stockPct(p: Product): number {
    return Math.min(100, Math.round((p.stock / Math.max(p.min_stock * 2, 1)) * 100));
  }

  taxLabel(p: Product): string {
    const pct = p.tax_rate?.percentage
      ?? (p.tax_rate_id ? this.taxRatesMap()[p.tax_rate_id]?.percentage : undefined)
      ?? 0;
    return pct === 0 ? '0%' : pct + '%';
  }

  openStockDialog(product: Product): void {
    const ref = this.dialog.open(StockAdjustDialogComponent, {
      data: product,
      width: '480px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  toggleStatus(product: Product): void {
    const action = product.status === 'ACTIVE'
      ? this.productsService.deactivate(product.id)
      : this.productsService.activate(product.id);
    action.subscribe({
      next: () => {
        this.snackBar.open(
          product.status === 'ACTIVE' ? 'Producto desactivado' : 'Producto activado',
          'OK', { duration: 3000 }
        );
        this.load();
      },
      error: () => {},
    });
  }

  deleteProduct(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar producto', message: `¿Eliminar "${product.name}"?`, confirmText: 'Eliminar', danger: true },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.productsService.remove(product.id).subscribe({
          next: () => { this.snackBar.open('Producto eliminado', 'OK', { duration: 3000 }); this.load(); },
          error: () => {},
        });
      }
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.openDropdown.set(null); }

  toggleDropdown(name: 'supplier' | 'status', event: MouseEvent): void {
    event.stopPropagation();
    this.openDropdown.update(curr => curr === name ? null : name);
  }

  setPage(n: number): void { this.currentPage.set(n); }

  setTabFilter(tab: 'all' | 'low' | 'out'): void {
    this.tabFilter.set(tab);
    this.currentPage.set(0);
  }

  clearFilters(): void {
    this.supplierFilter.set(null);
    this.statusFilter.set(null);
    this.searchCtrl.setValue('');
    this.currentPage.set(0);
  }

  openProductPopup(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    this.productPopup.set(product);
  }

  closeProductPopup(): void { this.productPopup.set(null); }

  openCsvImport(): void {
    const ref = this.dialog.open(CsvImportDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe(result => { if (result) this.load(); });
  }

  exportCsv(): void {
    const rows = this.filteredProducts();
    const headers = ['SKU', 'Nombre', 'Precio', 'Costo', 'Stock', 'Stock mínimo', 'Estado', 'IVA', 'Proveedor'];
    const lines = rows.map(p => [
      p.sku ?? '',
      p.name,
      (+p.sale_price).toFixed(2),
      p.purchase_price != null ? (+p.purchase_price).toFixed(2) : '',
      p.stock,
      p.min_stock,
      p.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
      this.taxLabel(p),
      p.supplier?.name ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    this.downloadCsv([headers.join(','), ...lines].join('\n'), 'productos');
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

  canEdit(): boolean        { return this.authService.isSystemUser() || this.authService.isStoreAdmin(); }
  canAdjustStock(): boolean { return this.authService.isStoreAdmin() || this.authService.isStoreWarehouse(); }
}
