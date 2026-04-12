import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoicesService } from '../../../core/services/invoices.service';
import { CustomersService } from '../../../core/services/customers.service';
import { ProductsService } from '../../../core/services/products.service';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { Customer } from '../../../core/models/customer.model';
import { Product } from '../../../core/models/product.model';
import { TaxRate } from '../../../core/models/tax-rate.model';

@Component({
  selector: 'app-invoice-create',
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
  ],
  templateUrl: './invoice-create.component.html',
})
export class InvoiceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private invoicesService = inject(InvoicesService);
  private customersService = inject(CustomersService);
  private productsService = inject(ProductsService);
  private taxRatesService = inject(TaxRatesService);
  private snackBar = inject(MatSnackBar);

  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  taxRates = signal<TaxRate[]>([]);
  saving = signal(false);

  form = this.fb.group({
    customer_id: [null as number | null],
    issue_date: [new Date().toISOString().split('T')[0]],
    items: this.fb.array([this.buildItem()]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.customersService.list({ limit: 100 }).subscribe({ next: r => this.customers.set(r.data) });
    this.productsService.list({ limit: 100 }).subscribe({ next: r => this.products.set(r.data) });
    this.taxRatesService.list({ limit: 100 }).subscribe({ next: r => this.taxRates.set(r.data) });
  }

  buildItem() {
    return this.fb.group({
      product_id: [null as number | null],
      product_name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [0, [Validators.required, Validators.min(0)]],
      tax_rate_id: [null as number | null],
    });
  }

  addItem(): void {
    this.items.push(this.buildItem());
  }

  removeItem(i: number): void {
    if (this.items.length > 1) this.items.removeAt(i);
  }

  onProductSelect(i: number, productId: number): void {
    const product = this.products().find(p => p.id === productId);
    if (product) {
      this.items.at(i).patchValue({
        product_name: product.name,
        unit_price: product.sale_price,
        tax_rate_id: product.tax_rate_id ?? null,
      });
    }
  }

  get subtotal(): number {
    return this.items.controls.reduce((sum, ctrl) => {
      return sum + (ctrl.value.quantity ?? 0) * (ctrl.value.unit_price ?? 0);
    }, 0);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const raw = this.form.value;
    this.invoicesService.create({
      customer_id: raw.customer_id ?? undefined,
      issue_date: raw.issue_date ?? undefined,
      items: (raw.items ?? []).map((item: any) => ({
        product_id: item.product_id ?? undefined,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate_id: item.tax_rate_id ?? undefined,
      })),
    }).subscribe({
      next: inv => {
        this.snackBar.open('Factura creada', 'OK', { duration: 3000 });
        this.router.navigate(['/invoices', inv.id]);
      },
      error: () => this.saving.set(false),
    });
  }
}
