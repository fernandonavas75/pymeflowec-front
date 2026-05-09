import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ProductsService } from '../../../core/services/products.service';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { ExpensesService } from '../../../core/services/expenses.service';
import { ExpenseCategoriesService } from '../../../core/services/expense-categories.service';
import { Supplier } from '../../../core/models/supplier.model';
import { TaxRate } from '../../../core/models/tax-rate.model';
import { ExpenseCategory } from '../../../core/models/expense-category.model';

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

  private expenseSvc = inject(ExpensesService);
  private catSvc     = inject(ExpenseCategoriesService);

  loading = signal(false);
  saving = signal(false);
  productId = signal<string | null>(null);
  suppliers = signal<Supplier[]>([]);
  taxRates  = signal<TaxRate[]>([]);
  private inventarioCategory = signal<ExpenseCategory | null>(null);

  form = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(2)]],
    description:    [''],
    sku:            [''],
    supplier_id:    [null as number | null],
    tax_rate_id:    [null as number | null],
    purchase_price: [0, [Validators.required, Validators.min(0)]],
    sale_price:     [0, [Validators.required, Validators.min(0.01)]],
    stock:          [0, [Validators.required, Validators.min(0), ProductFormComponent.integerOnly]],
    min_stock:      [5, [Validators.required, Validators.min(0), ProductFormComponent.integerOnly]],
  });

  private static integerOnly(c: AbstractControl): ValidationErrors | null {
    const v = c.value;
    return v !== null && v !== '' && !Number.isInteger(Number(v)) ? { integer: true } : null;
  }

  get isEdit(): boolean { return !!this.productId(); }

  ngOnInit(): void {
    this.suppliersService.list({ limit: 100 }).subscribe(res => this.suppliers.set(res.data));
    this.taxRatesService.list({ limit: 100 }).subscribe(res => this.taxRates.set(res.data));
    this.catSvc.list({ limit: 500 }).subscribe({
      next: cats => {
        const cat = cats.find(c => c.is_active && c.category_type === 'INVENTARIO') ?? null;
        this.inventarioCategory.set(cat);
      },
      error: () => {},
    });

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
      next: (product) => {
        this.snackBar.open(this.isEdit ? 'Producto actualizado' : 'Producto creado', 'OK', { duration: 3000 });

        // Auto-register inventory expense on new product with initial stock
        const cat = this.inventarioCategory();
        const pp  = v.purchase_price ?? 0;
        const stk = v.stock ?? 0;
        if (!this.isEdit && cat && pp > 0 && stk > 0) {
          const amount = +(pp * stk).toFixed(2);
          this.expenseSvc.create({
            category_id:        cat.id,
            description:        `Adquisición de producto: ${v.name}`,
            amount,
            ...(v.supplier_id
              ? { supplier_id: v.supplier_id }
              : { supplier_name_free: 'Sin proveedor' }),
            expense_date:       new Date().toISOString().slice(0, 10),
          }).subscribe({
            error: () => this.snackBar.open('Producto creado pero no se pudo registrar el egreso de inventario', 'OK', { duration: 4000 }),
          });
        }

        this.router.navigate(['/products']);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al guardar', 'OK', { duration: 4000 });
        this.saving.set(false);
      },
    });
  }
}
