import { Component, computed, inject, OnInit, signal } from '@angular/core';
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

  private allProducts = signal<Product[]>([]);
  private taxRatesMap = signal<Record<number, TaxRate>>({});
  loading        = signal(true);
  tabFilter      = signal<'all' | 'low' | 'out'>('all');
  searchCtrl     = new FormControl('');
  productPopup   = signal<Product | null>(null);

  private searchQuery = toSignal(
    this.searchCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

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
    return list;
  });

  ngOnInit(): void { this.load(); }

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

  openProductPopup(product: Product, event: MouseEvent): void {
    event.stopPropagation();
    this.productPopup.set(product);
  }

  closeProductPopup(): void { this.productPopup.set(null); }

  canEdit(): boolean        { return this.authService.isSystemUser() || this.authService.isStoreAdmin(); }
  canAdjustStock(): boolean { return this.authService.isStoreAdmin() || this.authService.isStoreWarehouse(); }
}
