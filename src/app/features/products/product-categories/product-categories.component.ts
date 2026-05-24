import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith, finalize } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductCategoriesService } from '../../../core/services/product-categories.service';
import { ProductsService } from '../../../core/services/products.service';
import { ProductCategory } from '../../../core/models/product-category.model';
import { Product } from '../../../core/models/product.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-product-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: './product-categories.component.html',
})
export class ProductCategoriesComponent implements OnInit {
  private svc         = inject(ProductCategoriesService);
  private productsSvc = inject(ProductsService);
  private dialog      = inject(MatDialog);
  private snackBar    = inject(MatSnackBar);
  private fb          = inject(FormBuilder);

  allCategories = signal<ProductCategory[]>([]);
  private allProducts   = signal<Product[]>([]);

  loading         = signal(false);
  loadingProducts = signal(false);
  saving          = signal(false);
  savingProductId = signal<number | null>(null);

  searchCtrl        = new FormControl('');
  productSearchCtrl = new FormControl('');

  private searchQuery        = toSignal(this.searchCtrl.valueChanges.pipe(startWith('')),        { initialValue: '' });
  private productSearchQuery = toSignal(this.productSearchCtrl.valueChanges.pipe(startWith('')), { initialValue: '' });

  /** null = nada seleccionado, 'unassigned' = sin categoría, number = id categoría */
  selectedId = signal<number | 'unassigned' | null>(null);

  modalOpen = signal(false);
  editingId = signal<number | null>(null);

  form = this.fb.group({
    name:       ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
    parent_id:  [null as number | null],
    sort_order: [0, [Validators.required, Validators.min(0)]],
  });

  totalCount = computed(() => this.allCategories().length);

  filteredCategories = computed(() => {
    const q = (this.searchQuery() ?? '').toLowerCase();
    if (!q) return this.allCategories();
    return this.allCategories().filter(c => c.name.toLowerCase().includes(q));
  });

  parentOptions = computed(() =>
    this.allCategories().filter(c => c.id !== (this.editingId() ?? -1))
  );

  productCountByCategory = computed(() => {
    const map = new Map<number | null, number>();
    for (const p of this.allProducts()) {
      const key = p.category_id ?? null;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  });

  unassignedCount = computed(() => this.productCountByCategory().get(null) ?? 0);

  panelProducts = computed(() => {
    const id = this.selectedId();
    if (id === null) return [];
    const base = id === 'unassigned'
      ? this.allProducts().filter(p => !p.category_id)
      : this.allProducts().filter(p => p.category_id === id);
    const q = (this.productSearchQuery() ?? '').toLowerCase();
    if (!q) return base;
    return base.filter(p => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q));
  });

  selectedCategoryName = computed(() => {
    const id = this.selectedId();
    if (id === null) return '';
    if (id === 'unassigned') return 'Sin categoría';
    return this.allCategories().find(c => c.id === id)?.name ?? '';
  });

  ngOnInit(): void {
    this.load();
    this.loadProducts();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: cats => this.allCategories.set(cats),
      error: () => this.allCategories.set([]),
    });
  }

  loadProducts(): void {
    this.loadingProducts.set(true);
    this.productsSvc.list({ limit: 1000 }).pipe(finalize(() => this.loadingProducts.set(false))).subscribe({
      next: res => this.allProducts.set(res.data),
      error: () => this.allProducts.set([]),
    });
  }

  selectCategory(id: number | 'unassigned'): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
    this.productSearchCtrl.setValue('');
  }

  assignCategory(product: Product, event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    const newCatId: number | null = raw === '' ? null : +raw;
    if (newCatId === (product.category_id ?? null)) return;

    this.savingProductId.set(product.id);
    this.productsSvc.update(product.id, { category_id: newCatId }).subscribe({
      next: (updated) => {
        this.allProducts.update(list =>
          list.map(p => p.id === updated.id ? { ...p, category_id: updated.category_id ?? null } : p)
        );
        this.savingProductId.set(null);
        this.snackBar.open('Categoría actualizada', 'OK', { duration: 2000 });
      },
      error: () => {
        this.savingProductId.set(null);
        this.snackBar.open('Error al actualizar', 'OK', { duration: 3000 });
        this.loadProducts();
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', parent_id: null, sort_order: 0 });
    this.modalOpen.set(true);
  }

  openEdit(cat: ProductCategory): void {
    this.editingId.set(cat.id);
    this.form.patchValue({ name: cat.name, parent_id: cat.parent_id ?? null, sort_order: cat.sort_order });
    this.modalOpen.set(true);
  }

  closeModal(): void { this.modalOpen.set(false); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const dto = { name: v.name!, parent_id: v.parent_id ?? null, sort_order: v.sort_order ?? 0 };

    const id = this.editingId();
    const obs = id ? this.svc.update(id, dto) : this.svc.create(dto);

    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snackBar.open(id ? 'Categoría actualizada' : 'Categoría creada', 'OK', { duration: 3000 });
        this.closeModal();
        this.load();
      },
      error: (err) => this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 }),
    });
  }

  deleteCategory(cat: ProductCategory): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar categoría',
        message: `¿Eliminar "${cat.name}"? Los productos asignados quedarán sin categoría.`,
        confirmText: 'Eliminar',
        danger: true,
      },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.svc.remove(cat.id).subscribe({
        next: () => {
          this.snackBar.open('Categoría eliminada', 'OK', { duration: 3000 });
          if (this.selectedId() === cat.id) this.selectedId.set(null);
          this.load();
          this.loadProducts();
        },
        error: (err) => this.snackBar.open(err?.error?.message || 'Error al eliminar', 'OK', { duration: 4000 }),
      });
    });
  }

  parentName(cat: ProductCategory): string {
    if (!cat.parent_id) return '—';
    return this.allCategories().find(c => c.id === cat.parent_id)?.name ?? '—';
  }
}
