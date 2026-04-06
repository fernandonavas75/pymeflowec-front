import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { ProductUnit } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  productId = signal<string | null>(null);
  categories = signal<Category[]>([]);

  readonly units: { value: ProductUnit; label: string }[] = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'kg', label: 'Kilogramo (kg)' },
    { value: 'lb', label: 'Libra (lb)' },
    { value: 'litro', label: 'Litro' },
    { value: 'metro', label: 'Metro' },
    { value: 'paquete', label: 'Paquete' },
    { value: 'caja', label: 'Caja' },
    { value: 'docena', label: 'Docena' },
    { value: 'funda', label: 'Funda' },
  ];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category_id: [null as string | null],
    unit: ['unidad' as ProductUnit, Validators.required],
    cost_price: [0, [Validators.required, Validators.min(0)]],
    unit_price: [0, [Validators.required, Validators.min(0.01)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    min_stock: [5, [Validators.required, Validators.min(0)]],
    sku: [''],
    barcode: [''],
  });

  get isEdit(): boolean {
    return !!this.productId();
  }

  ngOnInit(): void {
    this.categoriesService.list({ limit: 100 }).subscribe(res => this.categories.set(res.data));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.loading.set(true);
      this.productsService.getById(id).subscribe({
        next: product => {
          this.form.patchValue({
            name: product.name,
            description: product.description ?? '',
            category_id: product.category_id ?? null,
            unit: product.unit,
            cost_price: product.cost_price,
            unit_price: product.unit_price,
            stock: product.stock,
            min_stock: product.min_stock,
            sku: product.sku ?? '',
            barcode: product.barcode ?? '',
          });
          if (this.isEdit) {
            this.form.get('stock')?.disable();
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['/products']);
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const v = this.form.getRawValue();
    const dto = {
      name: v.name!,
      description: v.description || undefined,
      category_id: v.category_id ?? undefined,
      unit: v.unit as ProductUnit,
      cost_price: v.cost_price ?? 0,
      unit_price: v.unit_price!,
      stock: this.isEdit ? undefined : (v.stock ?? 0),
      min_stock: v.min_stock ?? 0,
      sku: v.sku || undefined,
      barcode: v.barcode || undefined,
    };

    const obs = this.isEdit
      ? this.productsService.update(this.productId()!, dto)
      : this.productsService.create(dto);

    obs.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEdit ? 'Producto actualizado' : 'Producto creado',
          'OK',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }
}
