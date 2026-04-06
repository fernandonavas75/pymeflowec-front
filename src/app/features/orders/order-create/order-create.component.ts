import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrdersService } from '../../../core/services/orders.service';
import { ClientsService } from '../../../core/services/clients.service';
import { ProductsService } from '../../../core/services/products.service';
import { Client } from '../../../core/models/client.model';
import { Product } from '../../../core/models/product.model';
import { AuthService } from '../../../core/services/auth.service';

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './order-create.component.html',
})
export class OrderCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private ordersService = inject(OrdersService);
  private clientsService = inject(ClientsService);
  private productsService = inject(ProductsService);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  saving = signal(false);
  selectedClient = signal<Client | null>(null);
  cartItems = signal<CartItem[]>([]);
  clientResults = signal<Client[]>([]);
  productResults = signal<Product[]>([]);

  clientSearchCtrl = new FormControl('');
  productSearchCtrl = new FormControl('');
  quantityCtrl = new FormControl(1, [Validators.min(1)]);
  selectedProduct = signal<Product | null>(null);

  taxRate = 0.12; // IVA por defecto Ecuador; el backend calcula el total real

  subtotal = computed(() => this.cartItems().reduce((s, i) => s + i.product.unit_price * i.quantity, 0));
  tax = computed(() => this.subtotal() * this.taxRate);
  total = computed(() => this.subtotal() + this.tax());

  ngOnInit(): void {
    this.clientSearchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(val => {
      if (val && val.length >= 2) {
        this.clientsService.list({ search: val, limit: 10 }).subscribe(res => {
          this.clientResults.set(res.data);
        });
      } else {
        this.clientResults.set([]);
      }
    });

    this.productSearchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(val => {
      if (val && val.length >= 2) {
        this.productsService.list({ search: val, limit: 10, status: 'active' }).subscribe(res => {
          this.productResults.set(res.data);
        });
      } else {
        this.productResults.set([]);
      }
    });
  }

  selectClient(client: Client): void {
    this.selectedClient.set(client);
    this.clientSearchCtrl.setValue(client.full_name, { emitEvent: false });
    this.clientResults.set([]);
  }

  selectProduct(product: Product): void {
    this.selectedProduct.set(product);
    this.productSearchCtrl.setValue(product.name, { emitEvent: false });
    this.productResults.set([]);
  }

  addToCart(): void {
    const product = this.selectedProduct();
    const qty = this.quantityCtrl.value || 1;
    if (!product) return;

    const existing = this.cartItems().find(i => i.product.id === product.id);
    if (existing) {
      this.cartItems.update(items =>
        items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
      );
    } else {
      this.cartItems.update(items => [...items, { product, quantity: qty }]);
    }

    this.selectedProduct.set(null);
    this.productSearchCtrl.setValue('', { emitEvent: false });
    this.quantityCtrl.setValue(1);
  }

  removeFromCart(productId: string): void {
    this.cartItems.update(items => items.filter(i => i.product.id !== productId));
  }

  updateQuantity(productId: string, qty: number): void {
    if (qty < 1) return;
    this.cartItems.update(items =>
      items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
    );
  }

  onSubmit(): void {
    if (!this.selectedClient() || this.cartItems().length === 0) return;

    this.saving.set(true);
    const data = {
      client_id: this.selectedClient()!.id,
      items: this.cartItems().map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    };

    this.ordersService.create(data).subscribe({
      next: order => {
        this.snackBar.open('Pedido creado exitosamente', 'OK', { duration: 3000, panelClass: ['success-snackbar'] });
        this.router.navigate(['/orders', order.id]);
      },
      error: () => this.saving.set(false),
    });
  }

  displayClientFn(client: Client): string {
    return client?.full_name || '';
  }
}
