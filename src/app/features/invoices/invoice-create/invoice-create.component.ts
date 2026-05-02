import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoicesService } from '../../../core/services/invoices.service';
import { CustomersService } from '../../../core/services/customers.service';
import { ProductsService } from '../../../core/services/products.service';
import { TaxRatesService } from '../../../core/services/tax-rates.service';
import { Customer } from '../../../core/models/customer.model';
import { Product } from '../../../core/models/product.model';
import { TaxRate } from '../../../core/models/tax-rate.model';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

interface CartItem { product: Product; qty: number; }

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent],
  templateUrl: './invoice-create.component.html',
  styleUrls: ['./invoice-create.component.scss'],
})
export class InvoiceCreateComponent implements OnInit {
  private router           = inject(Router);
  private invoicesService  = inject(InvoicesService);
  private customersService = inject(CustomersService);
  private productsService  = inject(ProductsService);
  private taxRatesService  = inject(TaxRatesService);
  private snackBar         = inject(MatSnackBar);

  allProducts        = signal<Product[]>([]);
  customers          = signal<Customer[]>([]);
  taxRates           = signal<TaxRate[]>([]);
  selectedCustomer   = signal<Customer | null>(null);
  showCustomerPicker = signal(false);
  selectedTaxRateId  = signal<number | null>(null);
  cart               = signal<CartItem[]>([]);
  saving             = signal(false);

  queryCtrl         = new FormControl('');
  customerQueryCtrl = new FormControl('');

  private queryVal = toSignal(
    this.queryCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );
  private customerQueryVal = toSignal(
    this.customerQueryCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

  filteredProducts = computed(() => {
    const q = (this.queryVal() ?? '').toLowerCase();
    return q
      ? this.allProducts().filter(p =>
          p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
      : this.allProducts();
  });

  filteredCustomers = computed(() => {
    const q = (this.customerQueryVal() ?? '').toLowerCase();
    return q
      ? this.customers().filter(c =>
          c.full_name.toLowerCase().includes(q) ||
          (c.document_number ?? '').toLowerCase().includes(q))
      : this.customers();
  });

  cartCount = computed(() => this.cart().reduce((s, i) => s + i.qty, 0));

  subtotal = computed(() =>
    this.cart().reduce((s, i) => s + i.qty * i.product.sale_price, 0)
  );

  selectedTaxRate = computed((): TaxRate | null =>
    this.taxRates().find(t => t.id === this.selectedTaxRateId()) ?? null
  );

  taxAmount = computed(() => {
    const rate = this.selectedTaxRate();
    return rate ? this.subtotal() * (rate.percentage / 100) : 0;
  });

  total = computed(() => this.subtotal() + this.taxAmount());

  ngOnInit(): void {
    this.customersService.list({ limit: 200 }).subscribe({
      next: r => {
        this.customers.set(r.data);
        const fc = r.data.find(c => c.customer_type === 'FINAL_CONSUMER') ?? r.data[0] ?? null;
        this.selectedCustomer.set(fc);
      },
    });

    this.productsService.list({ page: 1, limit: 1000 }).subscribe({
      next: r => this.allProducts.set(r.data.filter(p => p.status === 'ACTIVE')),
    });

    this.taxRatesService.list({ limit: 50 }).subscribe({
      next: r => {
        this.taxRates.set(r.data);
        const def = r.data.find(t => t.percentage === 15) ?? r.data[0] ?? null;
        if (def) this.selectedTaxRateId.set(def.id);
      },
    });
  }

  addToCart(p: Product): void {
    if (p.stock === 0) return;
    this.cart.update(cart => {
      const exists = cart.find(i => i.product.id === p.id);
      return exists
        ? cart.map(i => i.product.id === p.id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i)
        : [...cart, { product: p, qty: 1 }];
    });
  }

  changeQty(productId: number, delta: number): void {
    this.cart.update(cart =>
      cart
        .map(i => i.product.id === productId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
        .filter(i => i.qty > 0)
    );
  }

  removeFromCart(productId: number): void {
    this.cart.update(cart => cart.filter(i => i.product.id !== productId));
  }

  pickCustomer(c: Customer): void {
    this.selectedCustomer.set(c);
    this.showCustomerPicker.set(false);
    this.customerQueryCtrl.setValue('');
  }

  closeCustomerPicker(): void {
    this.showCustomerPicker.set(false);
    this.customerQueryCtrl.setValue('');
  }

  isInCart(productId: number): boolean {
    return this.cart().some(i => i.product.id === productId);
  }

  cartQty(productId: number): number {
    return this.cart().find(i => i.product.id === productId)?.qty ?? 0;
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  customerTypeLabel(c: Customer): string {
    if (c.customer_type === 'FINAL_CONSUMER') return 'Consumidor final';
    return c.customer_type;
  }

  stockState(p: Product): string {
    return p.stock === 0 ? 'out' : p.stock <= p.min_stock ? 'low' : '';
  }

  submit(): void {
    const cust = this.selectedCustomer();
    if (!cust) { this.snackBar.open('Selecciona un cliente', 'OK', { duration: 3000 }); return; }
    if (this.cart().length === 0) { this.snackBar.open('Agrega productos al carrito', 'OK', { duration: 3000 }); return; }

    this.saving.set(true);
    const taxRateId = this.selectedTaxRateId() ?? undefined;

    this.invoicesService.create({
      customer_id: cust.id,
      issue_date:  new Date().toISOString().split('T')[0],
      items: this.cart().map(i => ({
        product_id:   i.product.id,
        product_name: i.product.name,
        quantity:     i.qty,
        unit_price:   i.product.sale_price,
        tax_rate_id:  taxRateId,
      })),
    }).subscribe({
      next: inv => {
        this.snackBar.open('Factura creada correctamente', 'OK', { duration: 3000 });
        this.router.navigate(['/invoices', inv.id]);
      },
      error: () => this.saving.set(false),
    });
  }
}
