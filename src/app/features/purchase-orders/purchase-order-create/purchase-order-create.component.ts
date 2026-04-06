import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PurchaseOrdersService } from '../../../core/services/purchase-orders.service';
import { SuppliersService } from '../../../core/services/suppliers.service';
import { ProductsService } from '../../../core/services/products.service';
import { Supplier } from '../../../core/models/supplier.model';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-purchase-order-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './purchase-order-create.component.html',
})
export class PurchaseOrderCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private svc = inject(PurchaseOrdersService);
  private suppliersSvc = inject(SuppliersService);
  private productsSvc = inject(ProductsService);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);

  form = this.fb.group({
    supplier_id: [null as string | null, Validators.required],
    order_date: [new Date()],
    expected_date: [null as Date | null],
    notes: [''],
    items: this.fb.array([]),
  });

  get itemsArray(): FormArray { return this.form.get('items') as FormArray; }

  ngOnInit(): void {
    this.suppliersSvc.list({ limit: 100, status: 'active' }).subscribe(res => this.suppliers.set(res.data));
    this.productsSvc.list({ limit: 200, status: 'active' }).subscribe(res => this.products.set(res.data));
    this.addItem();
  }

  addItem(): void {
    this.itemsArray.push(this.fb.group({
      product_id: [null as string | null, Validators.required],
      quantity_ordered: [1, [Validators.required, Validators.min(0.001)]],
      unit_cost: [null as number | null, [Validators.required, Validators.min(0)]],
    }));
  }

  removeItem(i: number): void {
    if (this.itemsArray.length > 1) this.itemsArray.removeAt(i);
  }

  lineTotal(i: number): number {
    const item = this.itemsArray.at(i).value;
    return (item.quantity_ordered || 0) * (item.unit_cost || 0);
  }

  get orderTotal(): number {
    return this.itemsArray.controls.reduce((sum, _, i) => sum + this.lineTotal(i), 0);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.value;
    const dto = {
      supplier_id: +v.supplier_id!,
      order_date: v.order_date ? (v.order_date as Date).toISOString().split('T')[0] : undefined,
      expected_date: v.expected_date ? (v.expected_date as Date).toISOString().split('T')[0] : undefined,
      notes: v.notes || undefined,
      items: (v.items as any[]).map(i => ({
        product_id: +i.product_id,
        quantity_ordered: +i.quantity_ordered,
        unit_cost: +i.unit_cost,
      })),
    };
    this.svc.create(dto).subscribe({
      next: (po) => {
        this.snackBar.open('Orden de compra creada', 'OK', { duration: 3000 });
        this.router.navigate(['/purchase-orders', po.id]);
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error al crear la orden', 'OK', { duration: 5000 });
        this.saving.set(false);
      },
    });
  }
}
