import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ProductsService } from '../../../core/services/products.service';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { Supplier } from '../../../core/models/supplier.model';
import { TaxRate } from '../../../core/models/tax-rate.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private suppliersService = inject(SuppliersService);
  private taxRatesService = inject(TaxRatesService);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  productId = signal<string | null>(null);
  suppliers = signal<Supplier[]>([]);
  taxRates = signal<TaxRate[]>([]);

  form = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(2)]],
    description:    [''],
    sku:            [''],
    supplier_id:    [null as number | null],
    tax_rate_id:    [null as number | null],
    purchase_price: [0, [Validators.required, Validators.min(0)]],
    sale_price:     [0, [Validators.required, Validators.min(0.01)]],
    stock:          [0, [Validators.required, Validators.min(0)]],
    min_stock:      [5, [Validators.required, Validators.min(0)]],
  });

  get isEdit(): boolean { return !!this.productId(); }

  ngOnInit(): void {
    this.suppliersService.list({ limit: 100 }).subscribe(res => this.suppliers.set(res.data));
    this.taxRatesService.list({ limit: 100 }).subscribe(res => this.taxRates.set(res.data));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.loading.set(true);
      this.productsService.getById(id).subscribe({
        next: product => {
          this.form.patchValue({
            name:           product.name,
            description:    product.description ?? '',
            sku:            product.sku ?? '',
            supplier_id:    product.supplier_id ?? null,
            tax_rate_id:    product.tax_rate_id ?? null,
            purchase_price: product.purchase_price,
            sale_price:     product.sale_price,
            stock:          product.stock,
            min_stock:      product.min_stock,
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
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();

    const dto = {
      name:           v.name!,
      description:    v.description || undefined,
      sku:            v.sku || undefined,
      supplier_id:    v.supplier_id ?? undefined,
      tax_rate_id:    v.tax_rate_id ?? undefined,
      purchase_price: v.purchase_price ?? 0,
      sale_price:     v.sale_price!,
      stock:          this.isEdit ? undefined : (v.stock ?? 0),
      min_stock:      v.min_stock ?? 0,
    };

    const obs = this.isEdit
      ? this.productsService.update(this.productId()!, dto)
      : this.productsService.create(dto);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.isEdit ? 'Producto actualizado' : 'Producto creado', 'OK', { duration: 3000 });
        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }
}
