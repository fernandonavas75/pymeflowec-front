import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/models/product.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../core/services/auth.service';
import { StockAdjustDialogComponent } from '../stock-adjust-dialog/stock-adjust-dialog.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDialogModule,
    MatTooltipModule,
    StatusBadgeComponent,
  ],
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  products = signal<Product[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  limit = signal(20);

  searchCtrl = new FormControl('');
  statusCtrl = new FormControl('');

  get displayedColumns(): string[] {
    const base = ['name', 'stock', 'sale_price', 'status'];
    return this.canEdit() ? [...base, 'actions'] : base;
  }

  ngOnInit(): void {
    this.loadProducts();
    this.searchCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page.set(1);
      this.loadProducts();
    });
    this.statusCtrl.valueChanges.subscribe(() => {
      this.page.set(1);
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    const params: Record<string, string | number | boolean | undefined> = {
      page: this.page(),
      limit: this.limit(),
    };
    if (this.searchCtrl.value) params['search'] = this.searchCtrl.value;
    if (this.statusCtrl.value) params['status'] = this.statusCtrl.value;

    this.productsService.list(params).subscribe({
      next: res => {
        this.products.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPageChange(event: PageEvent): void {
    this.page.set(event.pageIndex + 1);
    this.limit.set(event.pageSize);
    this.loadProducts();
  }

  openStockDialog(product: Product): void {
    const ref = this.dialog.open(StockAdjustDialogComponent, {
      data: product,
      width: '400px',
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  toggleStatus(product: Product): void {
    const action = product.status === 'ACTIVE'
      ? this.productsService.deactivate(product.id)
      : this.productsService.activate(product.id);

    action.subscribe({
      next: () => {
        this.snackBar.open(
          product.status === 'ACTIVE' ? 'Producto desactivado' : 'Producto activado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.loadProducts();
      },
    });
  }

  deleteProduct(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar producto',
        message: `¿Estás seguro de eliminar "${product.name}"?`,
        confirmText: 'Eliminar',
        danger: true,
      },
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.productsService.remove(product.id).subscribe({
          next: () => {
            this.snackBar.open('Producto eliminado', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
            this.loadProducts();
          },
        });
      }
    });
  }

  canEdit(): boolean {
    return this.authService.isSystemUser() || this.authService.isStoreAdmin();
  }
}
